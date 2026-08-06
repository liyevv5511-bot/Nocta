import type { StateCreator } from 'zustand';

import { toast } from '@/features/ui';
// The store is not a component, so it reads the active language from the
// instance rather than a hook.
import { i18next } from '@/i18n';
import { ApiError, isApiError } from '@/types/api';
import type { Itinerary, ItineraryDay, PlanRequest } from '@/types/itinerary';

import { streamPlan as streamPlanApi } from './plan.api';
import { DEFAULT_DRAFT, type GenerationSlice, type PlanState } from './plan.types';

/**
 * The generation slice.
 *
 * Owns the request lifecycle: connect, stream, validate, accumulate, close.
 * Every frame has already been parsed against the shared Zod schema by
 * `plan.api.ts` before it reaches this file, so the handler below deals only
 * in known-good events.
 *
 * The abort controller is module-scoped rather than stored: it is a transport
 * handle, not renderable state, and putting it in the store would re-render
 * every subscriber the moment a request starts.
 */
let activeController: AbortController | null = null;

export const createGenerationSlice: StateCreator<PlanState, [], [], GenerationSlice> = (
  set,
  get,
) => ({
  phase: 'idle',
  statusMessage: '',
  progress: 0,
  itinerary: null,
  expectedDays: DEFAULT_DRAFT.days,
  error: null,

  generate: async () => {
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;

    const { draft } = get();
    const request: PlanRequest = {
      destination: draft.destination.trim(),
      days: draft.days,
      moods: draft.moods,
      budgetPerDay: draft.budgetPerDay,
      pace: draft.pace,
    };

    set({
      phase: 'thinking',
      statusMessage: 'Connecting to the planner…',
      progress: 0.02,
      itinerary: null,
      expectedDays: request.days,
      error: null,
    });

    try {
      await streamPlanApi(
        request,
        {
          onEvent: (event) => {
            switch (event.type) {
              case 'status':
                set((state) => ({
                  statusMessage: event.message,
                  // Progress must never go backwards, even if frames race.
                  progress: Math.max(state.progress, event.progress),
                }));
                break;

              case 'meta':
                set({
                  phase: 'streaming',
                  expectedDays: event.totalDays,
                  itinerary: {
                    id: event.id,
                    meta: event.meta,
                    summary: event.summary,
                    days: [],
                    highlights: [],
                    generatedAt: new Date().toISOString(),
                  },
                });
                break;

              case 'day':
                set((state) => appendDay(state.itinerary, event.day));
                break;

              case 'done':
                set((state) => ({
                  phase: 'done',
                  progress: 1,
                  statusMessage: 'Plan ready.',
                  itinerary:
                    state.itinerary === null
                      ? null
                      : {
                          ...state.itinerary,
                          highlights: event.highlights,
                          generatedAt: event.generatedAt,
                        },
                }));
                break;

              case 'error':
                set({
                  phase: 'error',
                  error: new ApiError('server', event.message),
                  statusMessage: '',
                });
                toast.error(i18next.t('errors.generationFailed'), event.message);
                break;
            }
          },
          onInvalidFrame: (_raw, issue) => {
            // Non-fatal: one bad frame should not discard four good days.
            console.warn('[nocta] dropped malformed plan frame:', issue);
          },
        },
        controller.signal,
      );
    } catch (error) {
      const apiError = isApiError(error)
        ? error
        : new ApiError('server', 'Unexpected planner failure');
      if (apiError.kind === 'aborted') {
        set({ phase: 'idle', statusMessage: '', progress: 0 });
        return;
      }

      set({ phase: 'error', error: apiError, statusMessage: '' });
      toast.error(i18next.t('errors.couldNotBuild'), apiError.userMessage);
    } finally {
      if (activeController === controller) activeController = null;
    }
  },

  cancel: () => {
    activeController?.abort();
    activeController = null;
    set({ phase: 'idle', statusMessage: '', progress: 0 });
  },

  reset: () => {
    activeController?.abort();
    activeController = null;
    set({
      phase: 'idle',
      statusMessage: '',
      progress: 0,
      itinerary: null,
      error: null,
    });
  },

  loadItinerary: (itinerary) => {
    set({
      itinerary,
      phase: 'done',
      progress: 1,
      expectedDays: itinerary.days.length,
      error: null,
      draft: {
        destination: itinerary.meta.destination,
        days: itinerary.days.length,
        moods: [...itinerary.meta.moods],
        budgetPerDay: itinerary.meta.budgetPerDay,
        pace: itinerary.meta.pace,
      },
    });
  },
});

function appendDay(itinerary: Itinerary | null, day: ItineraryDay): Partial<PlanState> {
  if (itinerary === null) return {};

  // Guard against a duplicate frame — cheaper than trusting the transport.
  if (itinerary.days.some((existing) => existing.id === day.id)) return {};

  return { itinerary: { ...itinerary, days: [...itinerary.days, day] } };
}

import { create } from 'zustand';

import { toast } from '@/features/ui';
import { ApiError, isApiError } from '@/types/api';
import type {
  ActivityBlock,
  Itinerary,
  ItineraryDay,
  Mood,
  Pace,
  PlanRequest,
} from '@/types/itinerary';

import { fetchAlternatives as fetchAlternativesApi, streamPlan as streamPlanApi } from './plan.api';
import {
  moveBlockBetweenDays,
  removeBlock,
  reorderWithinDay,
  replaceBlock,
} from './itinerary.reducer';

/**
 * Generation state.
 *
 * A discriminated union rather than a `isLoading` boolean, because the
 * interesting states are not binary: `streaming` has partial days to render,
 * `error` may still have partial days worth keeping on screen, and `idle` is
 * genuinely different from `done` with zero days.
 */
export type GenerationPhase = 'idle' | 'thinking' | 'streaming' | 'done' | 'error';

export interface DraftRequest {
  destination: string;
  days: number;
  moods: Mood[];
  budgetPerDay: number;
  pace: Pace;
}

export const DEFAULT_DRAFT: DraftRequest = {
  destination: '',
  days: 3,
  moods: ['food', 'culture'],
  budgetPerDay: 120,
  pace: 'balanced',
};

interface PlanState {
  draft: DraftRequest;
  phase: GenerationPhase;
  statusMessage: string;
  progress: number;
  /** Days arrive one frame at a time; this is what the timeline renders. */
  itinerary: Itinerary | null;
  expectedDays: number;
  error: ApiError | null;

  setDraft: (patch: Partial<DraftRequest>) => void;
  toggleMood: (mood: Mood) => void;
  generate: () => Promise<void>;
  cancel: () => void;
  reset: () => void;

  reorder: (dayId: string, fromIndex: number, toIndex: number) => void;
  moveAcrossDays: (fromDayId: string, toDayId: string, blockId: string, toIndex: number) => void;
  swapBlock: (dayId: string, blockId: string, replacement: ActivityBlock) => void;
  dropBlock: (dayId: string, blockId: string) => void;
  loadItinerary: (itinerary: Itinerary) => void;
  fetchAlternatives: (blockId: string, kind: ActivityBlock['kind']) => Promise<ActivityBlock[]>;
}

/** Held outside the store: it is a transport handle, not renderable state. */
let activeController: AbortController | null = null;

export const usePlanStore = create<PlanState>((set, get) => ({
  draft: DEFAULT_DRAFT,
  phase: 'idle',
  statusMessage: '',
  progress: 0,
  itinerary: null,
  expectedDays: DEFAULT_DRAFT.days,
  error: null,

  setDraft: (patch) => {
    set((state) => ({ draft: { ...state.draft, ...patch } }));
  },

  toggleMood: (mood) => {
    set((state) => {
      const has = state.draft.moods.includes(mood);
      // At least one mood must stay selected — an empty mood set makes the
      // scoring function meaningless and the plan arbitrary.
      if (has && state.draft.moods.length === 1) return state;

      return {
        draft: {
          ...state.draft,
          moods: has
            ? state.draft.moods.filter((m) => m !== mood)
            : [...state.draft.moods, mood].slice(0, 4),
        },
      };
    });
  },

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
                toast.error('Generation failed', event.message);
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
      toast.error('Could not build your plan', apiError.userMessage);
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

  reorder: (dayId, fromIndex, toIndex) => {
    set((state) =>
      state.itinerary === null
        ? state
        : { itinerary: reorderWithinDay(state.itinerary, dayId, fromIndex, toIndex) },
    );
  },

  moveAcrossDays: (fromDayId, toDayId, blockId, toIndex) => {
    set((state) =>
      state.itinerary === null
        ? state
        : {
            itinerary: moveBlockBetweenDays(state.itinerary, fromDayId, toDayId, blockId, toIndex),
          },
    );
  },

  swapBlock: (dayId, blockId, replacement) => {
    set((state) =>
      state.itinerary === null
        ? state
        : { itinerary: replaceBlock(state.itinerary, dayId, blockId, replacement) },
    );
  },

  dropBlock: (dayId, blockId) => {
    set((state) =>
      state.itinerary === null
        ? state
        : { itinerary: removeBlock(state.itinerary, dayId, blockId) },
    );
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

  fetchAlternatives: async (blockId, kind) => {
    const { itinerary } = get();
    if (!itinerary) return [];

    return fetchAlternativesApi({
      destination: itinerary.meta.destination,
      blockId,
      kind,
      budgetPerDay: itinerary.meta.budgetPerDay,
    });
  },
}));

function appendDay(itinerary: Itinerary | null, day: ItineraryDay): Partial<PlanState> {
  if (itinerary === null) return {};

  // Guard against a duplicate frame — cheaper than trusting the transport.
  if (itinerary.days.some((existing) => existing.id === day.id)) return {};

  return { itinerary: { ...itinerary, days: [...itinerary.days, day] } };
}

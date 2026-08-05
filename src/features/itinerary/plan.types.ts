import type { ApiError } from '@/types/api';
import type { ActivityBlock, Itinerary, Mood, Pace } from '@/types/itinerary';

/**
 * Plan store shape, split across three slices.
 *
 * The state is one store — the slices are a decomposition of its *definition*,
 * not three independent stores. That matters: `generate()` resets the edit
 * slice's itinerary, and the edit slice reads the draft the generation slice
 * requested. Splitting them into separate stores would turn those into
 * cross-store subscriptions for no benefit.
 */

/**
 * A discriminated phase rather than an `isLoading` boolean, because the
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

/** What the user is asking for. */
export interface DraftSlice {
  draft: DraftRequest;
  setDraft: (patch: Partial<DraftRequest>) => void;
  toggleMood: (mood: Mood) => void;
}

/** The request in flight, and what has arrived from it so far. */
export interface GenerationSlice {
  phase: GenerationPhase;
  statusMessage: string;
  progress: number;
  /** Days arrive one frame at a time; this is what the timeline renders. */
  itinerary: Itinerary | null;
  expectedDays: number;
  error: ApiError | null;

  generate: () => Promise<void>;
  cancel: () => void;
  reset: () => void;
  loadItinerary: (itinerary: Itinerary) => void;
}

/** Everything the user does to a plan after it has arrived. */
export interface EditSlice {
  reorder: (dayId: string, fromIndex: number, toIndex: number) => void;
  moveAcrossDays: (fromDayId: string, toDayId: string, blockId: string, toIndex: number) => void;
  swapBlock: (dayId: string, blockId: string, replacement: ActivityBlock) => void;
  dropBlock: (dayId: string, blockId: string) => void;
  fetchAlternatives: (blockId: string, kind: ActivityBlock['kind']) => Promise<ActivityBlock[]>;
}

export type PlanState = DraftSlice & GenerationSlice & EditSlice;

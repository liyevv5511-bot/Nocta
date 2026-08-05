import type { StateCreator } from 'zustand';

import { fetchAlternatives as fetchAlternativesApi } from './plan.api';
import {
  moveBlockBetweenDays,
  removeBlock,
  reorderWithinDay,
  replaceBlock,
} from './itinerary.reducer';
import { DEFAULT_DRAFT, type DraftSlice, type EditSlice, type PlanState } from './plan.types';

export const createDraftSlice: StateCreator<PlanState, [], [], DraftSlice> = (set) => ({
  draft: DEFAULT_DRAFT,

  setDraft: (patch) => {
    set((state) => ({ draft: { ...state.draft, ...patch } }));
  },

  toggleMood: (mood) => {
    set((state) => {
      const has = state.draft.moods.includes(mood);
      // At least one mood must stay selected — an empty mood set makes the
      // scoring function meaningless and the resulting plan arbitrary.
      if (has && state.draft.moods.length === 1) return state;

      return {
        draft: {
          ...state.draft,
          moods: has
            ? state.draft.moods.filter((candidate) => candidate !== mood)
            : [...state.draft.moods, mood].slice(0, 4),
        },
      };
    });
  },
});

/**
 * Edits delegate every structural change to the pure reducer, which also
 * re-times the affected day. The slice's only job is to hold the `null` guard
 * in one place rather than in five components.
 */
export const createEditSlice: StateCreator<PlanState, [], [], EditSlice> = (set, get) => ({
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
});

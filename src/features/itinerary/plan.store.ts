import { create } from 'zustand';

import { createGenerationSlice } from './plan.generation';
import { createDraftSlice, createEditSlice } from './plan.slices';
import type { PlanState } from './plan.types';

/**
 * The plan store, composed from three slices.
 *
 * The slices decompose the store's *definition*, not the store itself.
 * `generate()` resets the itinerary the edit slice operates on, and both read
 * the draft — keeping them in one store makes those ordinary state updates
 * rather than cross-store subscriptions.
 */
export const usePlanStore = create<PlanState>()((...args) => ({
  ...createDraftSlice(...args),
  ...createGenerationSlice(...args),
  ...createEditSlice(...args),
}));

export {
  DEFAULT_DRAFT,
  type DraftRequest,
  type GenerationPhase,
  type PlanState,
} from './plan.types';

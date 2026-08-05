import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  /** Milliseconds. `null` pins the toast until dismissed — used for errors. */
  duration: number | null;
  action?: { label: string; onAction: () => void };
}

export interface ToastInput {
  tone?: ToastTone;
  title: string;
  description?: string;
  duration?: number | null;
  action?: { label: string; onAction: () => void };
}

interface ToastState {
  toasts: Toast[];
  push: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

/** Beyond this the stack becomes noise; the oldest is dropped. */
const MAX_VISIBLE = 4;

const DEFAULT_DURATION: Record<ToastTone, number | null> = {
  info: 4500,
  success: 4000,
  warning: 7000,
  // Errors stay until acknowledged — an error that vanishes was not reported.
  error: null,
};

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  push: (input) => {
    counter += 1;
    const id = `toast-${String(counter)}`;
    const tone = input.tone ?? 'info';

    const toast: Toast = {
      id,
      tone,
      title: input.title,
      duration: input.duration === undefined ? DEFAULT_DURATION[tone] : input.duration,
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.action === undefined ? {} : { action: input.action }),
    };

    set((state) => ({ toasts: [...state.toasts, toast].slice(-MAX_VISIBLE) }));
    return id;
  },

  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
  },

  clear: () => {
    set({ toasts: [] });
  },
}));

/**
 * Imperative helper for non-React call sites (error boundaries, the storage
 * layer, stream handlers). Reading `getState` avoids forcing those modules to
 * become components just to report something.
 */
export const toast = {
  info: (title: string, description?: string) =>
    useToastStore
      .getState()
      .push({ tone: 'info', title, ...(description === undefined ? {} : { description }) }),
  success: (title: string, description?: string) =>
    useToastStore
      .getState()
      .push({ tone: 'success', title, ...(description === undefined ? {} : { description }) }),
  warning: (title: string, description?: string) =>
    useToastStore
      .getState()
      .push({ tone: 'warning', title, ...(description === undefined ? {} : { description }) }),
  error: (title: string, description?: string, action?: Toast['action']) =>
    useToastStore.getState().push({
      tone: 'error',
      title,
      ...(description === undefined ? {} : { description }),
      ...(action === undefined ? {} : { action }),
    }),
};

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

import { cn } from '@/lib/cn';
import { SPRING, transition } from '@/lib/motion';

import { useToastStore, type Toast as ToastModel, type ToastTone } from './toast.store';

const TONE_STYLES: Record<ToastTone, { accent: string; icon: React.ReactNode }> = {
  info: { accent: 'bg-accent', icon: <IconInfo /> },
  success: { accent: 'bg-success', icon: <IconCheck /> },
  warning: { accent: 'bg-warning', icon: <IconAlert /> },
  error: { accent: 'bg-danger', icon: <IconAlert /> },
};

/**
 * Toast layer.
 *
 * Mounted once, at the root, above every route. The live region is
 * `polite`/`atomic` so a screen reader finishes the current sentence before
 * announcing — errors are the exception and are marked `assertive` on the
 * individual toast, since an unannounced failure is a silent one.
 */
export function ToastViewport(): React.ReactElement {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      style={{ zIndex: 'var(--z-toast)' }}
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ toast }: { toast: ToastModel }): React.ReactElement {
  const dismiss = useToastStore((state) => state.dismiss);
  const { duration, id } = toast;

  useEffect(() => {
    if (duration === null) return;
    const timer = window.setTimeout(() => {
      dismiss(id);
    }, duration);
    return () => {
      window.clearTimeout(timer);
    };
  }, [duration, id, dismiss]);

  const tone = TONE_STYLES[toast.tone];

  return (
    <motion.div
      layout
      role={toast.tone === 'error' ? 'alert' : 'status'}
      aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97, transition: transition.fast }}
      transition={SPRING}
      className="glass pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-md pl-1"
    >
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', tone.accent)} />

      <div className="flex items-start gap-3 p-4">
        <span className={cn('mt-0.5 shrink-0', toneTextColour(toast.tone))}>{tone.icon}</span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary">{toast.title}</p>
          {toast.description === undefined ? null : (
            <p className="mt-1 text-sm text-secondary">{toast.description}</p>
          )}
          {toast.action === undefined ? null : (
            <button
              type="button"
              onClick={() => {
                toast.action?.onAction();
                dismiss(toast.id);
              }}
              className="mt-2.5 text-sm font-semibold text-accent underline-offset-4 hover:underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            dismiss(toast.id);
          }}
          aria-label={`Dismiss: ${toast.title}`}
          className="-m-1 shrink-0 rounded-xs p-1 text-tertiary transition-colors hover:text-primary"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor">
            <path d="M6 6l12 12M18 6L6 18" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

function toneTextColour(tone: ToastTone): string {
  switch (tone) {
    case 'success':
      return 'text-success';
    case 'warning':
      return 'text-warning';
    case 'error':
      return 'text-danger';
    case 'info':
      return 'text-accent';
  }
}

function IconInfo(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4.5"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" strokeWidth="1.75" />
      <path d="M12 11v5M12 8h.01" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4.5"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" strokeWidth="1.75" />
      <path
        d="M8.5 12.5l2.5 2.5 4.5-5"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconAlert(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4.5"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" strokeWidth="1.75" />
      <path d="M12 7.5v5M12 16h.01" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

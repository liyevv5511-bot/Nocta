import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GlassPanel } from '@/features/ui';
import { transition } from '@/lib/motion';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

export interface GenerationStatusProps {
  message: string;
  progress: number;
  onCancel: () => void;
}

/**
 * The thinking state.
 *
 * Two details worth defending:
 *
 * **The typewriter runs on a timer, not per character of state.** Retyping
 * would re-render the tree forty times a second; instead a single string
 * slice advances on an interval and only that node updates.
 *
 * **`aria-live="polite"` is on a separate node carrying the *plain* message.**
 * Announcing the animated text would read out partial words. Sighted users
 * get the effect; screen-reader users get the sentence.
 */
export function GenerationStatus({
  message,
  progress,
  onCancel,
}: GenerationStatusProps): React.ReactElement {
  const { t } = useTranslation();
  const typed = useTypewriter(message);

  return (
    <GlassPanel radius="xl" className="p-6 sm:p-8">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{t('plan.generating')}</p>

          <p className="mt-2 min-h-[3.5rem] text-h3 text-primary sm:min-h-[2.5rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={message}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={transition.fast}
                className="inline-block"
              >
                {typed}
                <Caret />
              </motion.span>
            </AnimatePresence>
          </p>

          <p aria-live="polite" className="sr-only">
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 rounded-sm border border-default px-3.5 py-1.5 text-sm text-secondary transition-colors hover:border-strong hover:text-primary"
        >
          {t('plan.cancel')}
        </button>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label={t('plan.progress')}
        className="mt-6 h-1 overflow-hidden rounded-pill bg-surface-hover"
      >
        <motion.div
          className="h-full rounded-pill bg-accent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress }}
          style={{ transformOrigin: 'left' }}
          transition={transition.slow}
        />
      </div>
    </GlassPanel>
  );
}

function Caret(): React.ReactElement {
  return (
    <motion.span
      aria-hidden="true"
      className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.12em] bg-accent"
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1], ease: 'linear' }}
    />
  );
}

/** Reveals `text` one character at a time. Returns it whole under reduced motion. */
function useTypewriter(text: string, charsPerSecond = 42): string {
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(text.length);

  useEffect(() => {
    if (reducedMotion) {
      setVisible(text.length);
      return;
    }

    setVisible(0);
    const interval = window.setInterval(() => {
      setVisible((count) => {
        if (count >= text.length) {
          window.clearInterval(interval);
          return count;
        }
        return count + 1;
      });
    }, 1000 / charsPerSecond);

    return () => {
      window.clearInterval(interval);
    };
  }, [text, charsPerSecond, reducedMotion]);

  return text.slice(0, visible);
}

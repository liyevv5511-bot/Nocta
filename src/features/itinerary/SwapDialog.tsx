import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ActivityCardSkeleton, Button, GlassPanel, Photo, toast } from '@/features/ui';
import { formatDuration, formatPrice } from '@/lib/format';
import { SPRING, transition } from '@/lib/motion';
import { isApiError } from '@/types/api';
import type { ActivityBlock, ActivityKind } from '@/types/itinerary';

import { KIND_META } from './kinds';
import { usePlanStore } from './plan.store';

export interface SwapDialogProps {
  dayId: string;
  blockId: string;
  kind: ActivityKind;
  currency: string;
  onClose: () => void;
}

/**
 * "Swap this" — alternatives for a single block.
 *
 * Uses a native `<dialog>` with `showModal()`, which gets the focus trap, the
 * inert background, Escape-to-close and the top-layer stacking from the
 * platform instead of from three hundred lines of hand-written focus
 * management. The only additions are the animation and the close-on-backdrop
 * behaviour, which `<dialog>` genuinely does not provide.
 */
export function SwapDialog({
  dayId,
  blockId,
  kind,
  currency,
  onClose,
}: SwapDialogProps): React.ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fetchAlternatives = usePlanStore((state) => state.fetchAlternatives);
  const swapBlock = usePlanStore((state) => state.swapBlock);

  const [alternatives, setAlternatives] = useState<ActivityBlock[] | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const load = useCallback(() => {
    setFailed(null);
    setAlternatives(null);

    fetchAlternatives(blockId, kind)
      .then(setAlternatives)
      .catch((error: unknown) => {
        setFailed(isApiError(error) ? error.userMessage : 'Could not load alternatives.');
      });
  }, [fetchAlternatives, blockId, kind]);

  useEffect(load, [load]);

  const close = useCallback(() => {
    dialogRef.current?.close();
    onClose();
  }, [onClose]);

  const choose = useCallback(
    (replacement: ActivityBlock) => {
      swapBlock(dayId, blockId, replacement);
      toast.success('Swapped', `${replacement.title} is now in that slot.`);
      close();
    },
    [swapBlock, dayId, blockId, close],
  );

  return (
    <dialog
      ref={dialogRef}
      data-focus-unstyled
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        // Clicks that land on the dialog element itself are backdrop clicks —
        // anything inside the panel stops at the panel.
        if (event.target === dialogRef.current) close();
      }}
      className="m-auto w-[min(40rem,calc(100vw-2rem))] bg-transparent p-0 backdrop:bg-[oklch(0%_0_0/0.55)]"
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={SPRING}
        >
          <GlassPanel tone="strong" radius="xl" className="max-h-[80svh] overflow-y-auto p-6">
            <header className="flex items-start justify-between gap-6">
              <div>
                <p className="eyebrow">Alternatives</p>
                <h2 className="mt-1.5 text-h2 text-primary">
                  Something else, {KIND_META[kind].label.toLowerCase()}-ish
                </h2>
                <p className="mt-2 max-w-prose text-sm text-secondary">
                  Picking one re-times the rest of the day around its duration and location.
                </p>
              </div>

              <button
                type="button"
                onClick={close}
                aria-label="Close alternatives"
                className="-m-1 rounded-xs p-1 text-tertiary transition-colors hover:text-primary"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor">
                  <path d="M6 6l12 12M18 6L6 18" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <div className="mt-6 space-y-3">
              {failed !== null ? (
                <div className="rounded-lg border border-subtle bg-surface-sunken p-6 text-center">
                  <p className="text-body text-secondary">{failed}</p>
                  <Button variant="secondary" size="sm" className="mt-4" onClick={load}>
                    Try again
                  </Button>
                </div>
              ) : alternatives === null ? (
                <>
                  <ActivityCardSkeleton />
                  <ActivityCardSkeleton />
                  <ActivityCardSkeleton />
                </>
              ) : alternatives.length === 0 ? (
                <p className="rounded-lg border border-subtle bg-surface-sunken p-6 text-center text-body text-secondary">
                  No alternatives left in this city that fit your budget. Try raising it.
                </p>
              ) : (
                alternatives.map((alternative) => (
                  <motion.button
                    key={alternative.id}
                    type="button"
                    onClick={() => {
                      choose(alternative);
                    }}
                    whileHover={{ x: 4 }}
                    transition={transition.fast}
                    className="flex w-full gap-4 rounded-lg border border-subtle bg-surface p-4 text-left transition-colors hover:border-accent"
                  >
                    <Photo
                      src={alternative.imageUrl}
                      alt=""
                      width={160}
                      height={160}
                      seed={alternative.id}
                      sizes="64px"
                      className="size-16 shrink-0 rounded-md"
                    />
                    <div className="min-w-0">
                      <p className={`eyebrow ${KIND_META[alternative.kind].textClass}`}>
                        {KIND_META[alternative.kind].label}
                      </p>
                      <p className="mt-1 font-semibold text-primary">{alternative.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-secondary">
                        {alternative.summary}
                      </p>
                      <p className="tabular mt-2 text-xs text-tertiary">
                        {formatDuration(alternative.durationMinutes)} ·{' '}
                        {alternative.price === 0
                          ? 'Free'
                          : formatPrice(alternative.price, currency)}
                      </p>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </GlassPanel>
        </motion.div>
      </AnimatePresence>
    </dialog>
  );
}

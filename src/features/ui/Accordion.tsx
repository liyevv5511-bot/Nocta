import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useId, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { transition } from '@/lib/motion';

export interface AccordionItem {
  id: string;
  question: string;
  answer: ReactNode;
}

export interface AccordionProps {
  items: readonly AccordionItem[];
  /** `single` closes the previous panel; `multiple` leaves them open. */
  mode?: 'single' | 'multiple';
  defaultOpenId?: string;
  className?: string;
}

/**
 * Disclosure list.
 *
 * Headless in the sense that matters: full keyboard support (arrow keys move
 * between headers, Home/End jump to the ends), correct `aria-expanded` /
 * `aria-controls` wiring, and headers that are real buttons inside real
 * headings so the document outline survives.
 *
 * Height animates via `height: auto` — Framer measures it, so the panel does
 * not need a hardcoded max-height that clips long answers.
 */
export function Accordion({
  items,
  mode = 'single',
  defaultOpenId,
  className,
}: AccordionProps): React.ReactElement {
  const baseId = useId();
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(defaultOpenId === undefined ? [] : [defaultOpenId]),
  );
  const headerRefs = useRef(new Map<string, HTMLButtonElement>());

  const toggle = useCallback(
    (id: string) => {
      setOpen((current) => {
        const next = new Set(mode === 'single' ? [] : current);
        if (current.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [mode],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();

      const lastIndex = items.length - 1;
      const targetIndex =
        event.key === 'ArrowDown'
          ? (index + 1) % items.length
          : event.key === 'ArrowUp'
            ? (index - 1 + items.length) % items.length
            : event.key === 'Home'
              ? 0
              : lastIndex;

      const target = items[targetIndex];
      if (target) headerRefs.current.get(target.id)?.focus();
    },
    [items],
  );

  return (
    <div className={cn('divide-y divide-[var(--border-subtle)]', className)}>
      {items.map((item, index) => {
        const isOpen = open.has(item.id);
        const headerId = `${baseId}-header-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;

        return (
          <div key={item.id}>
            <h3>
              <button
                ref={(node) => {
                  if (node) headerRefs.current.set(item.id, node);
                  else headerRefs.current.delete(item.id);
                }}
                id={headerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => {
                  toggle(item.id);
                }}
                onKeyDown={(event) => {
                  handleKeyDown(event, index);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-6 py-5 text-left',
                  'transition-colors duration-[var(--duration-fast)]',
                  'hover:text-accent',
                  isOpen ? 'text-primary' : 'text-secondary',
                )}
              >
                <span className="text-h3">{item.question}</span>
                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={transition.base}
                  className="grid size-8 shrink-0 place-items-center rounded-pill border border-default text-secondary"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor">
                    <path d="M12 5v14M5 12h14" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </motion.span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={transition.base}
                  className="overflow-hidden"
                >
                  <div className="max-w-prose pb-6 text-body text-secondary">{item.answer}</div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

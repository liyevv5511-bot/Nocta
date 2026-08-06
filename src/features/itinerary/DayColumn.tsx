import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/i18n/useLocale';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDuration } from '@/lib/format';
import { fadeUp, inViewport, stagger } from '@/lib/motion';
import type { ActivityKind, ItineraryDay } from '@/types/itinerary';

import { ActivityCard } from './ActivityCard';
import { dayTotals } from './itinerary.reducer';

export interface DayColumnProps {
  day: ItineraryDay;
  currency: string;
  sortable: boolean;
  onSwap: (dayId: string, blockId: string, kind: ActivityKind) => void;
  onRemove: (dayId: string, blockId: string) => void;
}

/**
 * One day of the plan.
 *
 * The header carries the day's derived totals — cost, time on foot, when it
 * ends — recomputed from the blocks rather than stored. That is what makes
 * drag-and-drop feel consequential: move an activity and the day's numbers
 * change, because they were never a snapshot in the first place.
 */
export function DayColumn({
  day,
  currency,
  sortable,
  onSwap,
  onRemove,
}: DayColumnProps): React.ReactElement {
  const { t } = useTranslation();
  const locale = useLocale();
  const totals = dayTotals(day);
  const blockIds = day.blocks.map((block) => block.id);

  return (
    <motion.section
      variants={stagger(0.05)}
      initial="hidden"
      whileInView="visible"
      viewport={inViewport}
      aria-labelledby={`${day.id}-heading`}
      className="scroll-mt-24"
      id={day.id}
    >
      <motion.header variants={fadeUp} className="mb-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <div>
            <p className="eyebrow">{t('itinerary.day', { count: day.dayNumber })}</p>
            <h3 id={`${day.id}-heading`} className="mt-1.5 text-h2 text-primary">
              {day.title}
            </h3>
          </div>

          <dl className="flex items-center gap-5 text-sm">
            <Stat
              label={t('itinerary.cost')}
              value={formatCurrency(totals.cost, currency, locale)}
            />
            <Stat
              label={t('itinerary.onFoot')}
              value={formatDuration(totals.walkMinutes, locale)}
            />
            <Stat label={t('itinerary.ends')} value={totals.endTime} />
          </dl>
        </div>

        <p className="mt-2.5 max-w-prose text-body text-secondary">{day.theme}</p>
      </motion.header>

      <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
        <ol className="space-y-5">
          {day.blocks.map((block) => (
            <motion.li key={block.id} variants={fadeUp}>
              <ActivityCard
                block={block}
                currency={currency}
                dayId={day.id}
                sortable={sortable}
                onSwap={(blockId, kind) => {
                  onSwap(day.id, blockId, kind);
                }}
                onRemove={(blockId) => {
                  onRemove(day.id, blockId);
                }}
              />
            </motion.li>
          ))}
        </ol>
      </SortableContext>
    </motion.section>
  );
}

function Stat({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className={cn('text-right')}>
      <dt className="text-mono-xs tracking-[0.09em] text-tertiary uppercase">{label}</dt>
      <dd className="tabular mt-0.5 font-semibold text-primary">{value}</dd>
    </div>
  );
}

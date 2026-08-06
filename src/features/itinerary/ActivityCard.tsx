import { useSortable } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import { CSS } from '@dnd-kit/utilities';
import { Chip, Photo } from '@/features/ui';
import { IconGrip, IconWalk } from '@/features/ui/icons';
import { useLocale } from '@/i18n/useLocale';
import { cn } from '@/lib/cn';
import { formatDuration, formatPrice, formatTime } from '@/lib/format';
import type { ActivityBlock, ActivityKind } from '@/types/itinerary';

import { ActivityMenu } from './ActivityMenu';
import { KIND_META } from './kinds';

export interface ActivityCardProps {
  block: ActivityBlock;
  currency: string;
  dayId: string;
  onSwap: (blockId: string, kind: ActivityKind) => void;
  onRemove: (blockId: string) => void;
  /** Disables drag while the plan is still streaming in. */
  sortable: boolean;
}

/**
 * One activity in a day.
 *
 * The drag handle is a separate, labelled button rather than the whole card:
 * making the card itself draggable means a keyboard user cannot activate the
 * links inside it, and a touch user cannot scroll past it. dnd-kit's keyboard
 * sensor drives the same handle, so reordering works without a pointer.
 */
export function ActivityCard({
  block,
  currency,
  dayId,
  onSwap,
  onRemove,
  sortable,
}: ActivityCardProps): React.ReactElement {
  const { t } = useTranslation();
  const locale = useLocale();
  const kind = KIND_META[block.kind];

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    disabled: !sortable,
    data: { dayId, blockId: block.id },
  });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'group relative rounded-lg border border-subtle bg-surface',
        'transition-[border-color,box-shadow,opacity] duration-[var(--duration-fast)]',
        'hover:border-default hover:shadow-md',
        isDragging && 'z-10 opacity-40 shadow-lg',
      )}
      aria-label={`${block.startTime} — ${block.title}`}
    >
      {block.place.walkFromPrevious === null ? null : (
        <p className="absolute -top-3 left-6 flex items-center gap-1.5 rounded-pill border border-subtle bg-canvas px-2 py-0.5 text-mono-xs tracking-[0.09em] text-tertiary uppercase">
          <IconWalk />
          {formatDuration(block.place.walkFromPrevious, locale)}
        </p>
      )}

      <div className="flex gap-4 p-4">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <time className="tabular text-sm font-semibold text-primary" dateTime={block.startTime}>
            {formatTime(block.startTime, locale)}
          </time>
          {sortable ? (
            <button
              type="button"
              aria-label={`Reorder ${block.title}`}
              className="cursor-grab touch-none rounded-xs p-1 text-tertiary transition-colors hover:text-primary active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <IconGrip />
            </button>
          ) : null}
        </div>

        <Photo
          src={block.imageUrl}
          alt=""
          width={160}
          height={160}
          seed={block.id}
          sizes="80px"
          className="size-20 shrink-0 rounded-md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={cn('eyebrow', kind.textClass)}>{t(kind.labelKey)}</p>
              <h4 className="mt-1 text-h3 leading-snug text-primary">{block.title}</h4>
            </div>

            <ActivityMenu
              label={block.title}
              onSwap={() => {
                onSwap(block.id, block.kind);
              }}
              onRemove={() => {
                onRemove(block.id);
              }}
            />
          </div>

          <p className="mt-2 text-sm leading-relaxed text-secondary">{block.summary}</p>

          {block.note === null ? null : (
            <p className="mt-2.5 rounded-sm border-l-2 border-warning bg-surface-sunken px-3 py-2 text-sm text-secondary">
              {block.note}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-tertiary">
            <span className="tabular">{formatDuration(block.durationMinutes, locale)}</span>
            <span className="tabular font-medium text-primary">
              {block.price === 0 ? t('common.free') : formatPrice(block.price, currency, locale)}
            </span>
            <a
              href={mapLink(block)}
              target="_blank"
              rel="noreferrer noopener"
              className="underline-offset-4 transition-colors hover:text-accent hover:underline"
            >
              {block.place.address}
            </a>
          </div>

          {block.tags.length === 0 ? null : (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {block.tags.slice(0, 4).map((tag) => (
                <Chip key={tag} size="sm">
                  {tag}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function mapLink(block: ActivityBlock): string {
  const { lat, lng } = block.place.coordinates;
  const query = encodeURIComponent(`${block.place.name}, ${block.place.address}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}&center=${String(lat)},${String(lng)}`;
}

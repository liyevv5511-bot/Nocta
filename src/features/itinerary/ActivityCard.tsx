import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';

import { Chip, Photo } from '@/features/ui';
import { cn } from '@/lib/cn';
import { formatDuration, formatPrice, formatTime } from '@/lib/format';
import type { ActivityBlock, ActivityKind } from '@/types/itinerary';

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
  const [menuOpen, setMenuOpen] = useState(false);
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
          {formatDuration(block.place.walkFromPrevious)}
        </p>
      )}

      <div className="flex gap-4 p-4">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <time className="tabular text-sm font-semibold text-primary" dateTime={block.startTime}>
            {formatTime(block.startTime)}
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
              <p className={cn('eyebrow', kind.textClass)}>{kind.label}</p>
              <h4 className="mt-1 text-h3 leading-snug text-primary">{block.title}</h4>
            </div>

            <div className="relative shrink-0">
              <button
                type="button"
                aria-label={`Options for ${block.title}`}
                aria-expanded={menuOpen}
                onClick={() => {
                  setMenuOpen((open) => !open);
                }}
                className="rounded-xs p-1.5 text-tertiary opacity-0 transition-opacity group-hover:opacity-100 hover:text-primary focus-visible:opacity-100"
              >
                <IconDots />
              </button>

              {menuOpen ? (
                <div
                  role="menu"
                  className="glass absolute top-9 right-0 z-20 w-44 overflow-hidden rounded-md py-1"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onSwap(block.id, block.kind);
                    }}
                    className="block w-full px-3.5 py-2 text-left text-sm text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
                  >
                    Swap this
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onRemove(block.id);
                    }}
                    className="block w-full px-3.5 py-2 text-left text-sm text-danger transition-colors hover:bg-surface-hover"
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-secondary">{block.summary}</p>

          {block.note === null ? null : (
            <p className="mt-2.5 rounded-sm border-l-2 border-warning bg-surface-sunken px-3 py-2 text-sm text-secondary">
              {block.note}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-tertiary">
            <span className="tabular">{formatDuration(block.durationMinutes)}</span>
            <span className="tabular font-medium text-primary">
              {block.price === 0 ? 'Free' : formatPrice(block.price, currency)}
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

function IconWalk(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <circle cx="13" cy="4.5" r="1.75" strokeWidth="1.75" />
      <path
        d="M9 21l2.5-5.5L9 12l1-4 3.5 2 2.5 1M11.5 15.5L15 21"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGrip(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="1.4" />
      <circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" />
      <circle cx="15" cy="18" r="1.4" />
    </svg>
  );
}

function IconDots(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Photo } from '@/features/ui';
import { useLocale } from '@/i18n/useLocale';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDuration } from '@/lib/format';
import { SPRING, transition } from '@/lib/motion';

import type { RouteLeg, RouteStop } from './route.model';

export interface RouteStopsProps {
  stops: readonly RouteStop[];
  legs: readonly RouteLeg[];
  onRemove: (cityId: string) => void;
  onMove: (cityId: string, direction: -1 | 1) => void;
}

/**
 * The ordered itinerary of cities, with the travel between them.
 *
 * Reordering is buttons, not drag-and-drop — deliberately. A route is at most
 * six items on a page that is mostly map, and "move up" is unambiguous,
 * operable from the keyboard with no custom key handling, and works on touch
 * without competing with the page scroll. Drag is the right tool inside a day,
 * where there are twenty items and the gesture maps onto what you mean; it is
 * ceremony here.
 *
 * `layout` on each row does the work drag would have done visually: the list
 * springs into its new order rather than jumping.
 */
export function RouteStops({ stops, legs, onRemove, onMove }: RouteStopsProps): React.ReactElement {
  const { t } = useTranslation();
  const locale = useLocale();

  return (
    <ol className="relative">
      <AnimatePresence initial={false}>
        {stops.map((stop, index) => {
          const leg = index > 0 ? legs[index - 1] : undefined;

          return (
            <motion.li
              key={stop.city.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -16, transition: transition.fast }}
              transition={SPRING}
            >
              {leg === undefined ? null : <Leg leg={leg} />}

              <div className="flex items-center gap-4 rounded-lg border border-subtle bg-surface p-3">
                <span
                  aria-hidden="true"
                  className="tabular grid size-7 shrink-0 place-items-center rounded-pill bg-accent-muted text-xs font-semibold text-accent"
                >
                  {index + 1}
                </span>

                <Photo
                  src={stop.city.imageUrl}
                  alt=""
                  width={320}
                  height={240}
                  seed={stop.city.id}
                  sizes="56px"
                  className="size-14 shrink-0 rounded-md"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-primary">{stop.city.name}</p>
                  <p className="tabular mt-0.5 text-sm text-tertiary">
                    {t('common.nights', { count: stop.nights })} ·{' '}
                    {formatCurrency(
                      stop.nights * stop.city.avgDailyCost,
                      stop.city.currency,
                      locale,
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                  <MoveButton
                    label={t('route.moveEarlier', { city: stop.city.name })}
                    disabled={index === 0}
                    onClick={() => {
                      onMove(stop.city.id, -1);
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor">
                      <path
                        d="M12 19V5M5 12l7-7 7 7"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </MoveButton>

                  <MoveButton
                    label={t('route.moveLater', { city: stop.city.name })}
                    disabled={index === stops.length - 1}
                    onClick={() => {
                      onMove(stop.city.id, 1);
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor">
                      <path
                        d="M12 5v14M19 12l-7 7-7-7"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </MoveButton>

                  <button
                    type="button"
                    aria-label={t('route.removeStop', { city: stop.city.name })}
                    onClick={() => {
                      onRemove(stop.city.id);
                    }}
                    className="grid size-8 place-items-center rounded-sm text-tertiary transition-colors hover:text-danger"
                  >
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor">
                      <path d="M6 6l12 12M18 6L6 18" strokeWidth="1.75" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <Link
                to={`/plan?destination=${encodeURIComponent(stop.city.name)}`}
                className="mt-1.5 ml-11 inline-block text-sm text-tertiary underline-offset-4 transition-colors hover:text-accent hover:underline"
              >
                {t('route.planStop', { count: stop.nights, city: stop.city.name })}
              </Link>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
}

/** The travel between two stops, drawn as a rail on the left. */
function Leg({ leg }: { leg: RouteLeg }): React.ReactElement {
  const { t } = useTranslation();
  const locale = useLocale();

  return (
    <div className="flex items-center gap-3 py-2 pl-3.5">
      <span aria-hidden="true" className="h-8 w-px shrink-0 bg-[var(--border-default)]" />
      <p className="tabular text-mono-xs tracking-[0.09em] text-tertiary uppercase">
        {leg.mode === 'air' ? t('route.fly') : t('route.rail')} · {leg.distanceKm} km ·{' '}
        {formatDuration(leg.travelMinutes, locale)}
      </p>
    </div>
  );
}

function MoveButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'grid size-8 place-items-center rounded-sm transition-colors',
        disabled
          ? 'cursor-not-allowed text-[var(--border-default)]'
          : 'text-tertiary hover:text-primary',
      )}
    >
      {children}
    </button>
  );
}

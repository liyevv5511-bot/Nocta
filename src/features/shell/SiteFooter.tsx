import { Link } from 'react-router-dom';

const COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'Plan a trip', to: '/plan' },
      { label: 'Saved trips', to: '/saved' },
      { label: 'Design system', to: '/styleguide' },
    ],
  },
  {
    heading: 'Destinations',
    links: [
      { label: 'Lisbon', to: '/destination/lisbon' },
      { label: 'Tokyo', to: '/destination/tokyo' },
      { label: 'Mexico City', to: '/destination/mexico-city' },
    ],
  },
] as const;

export function SiteFooter(): React.ReactElement {
  return (
    <footer className="mt-auto border-t border-subtle">
      <div className="container-content grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="text-h3 tracking-[-0.02em] text-primary">Nocta</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-secondary">
            An itinerary planner that assumes you would rather walk than queue, and that dinner is
            the point of the day.
          </p>
          <p className="mt-6 text-xs text-tertiary">
            A portfolio project. The planner is a local service with a hand-built venue catalogue —
            no model is called, and no data leaves your browser.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h2 className="eyebrow">{column.heading}</h2>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-secondary underline-offset-4 transition-colors hover:text-primary hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="container-content flex flex-col gap-2 border-t border-subtle py-6 text-xs text-tertiary sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Nocta. Built as a demonstration, not a booking service.</p>
        <p className="tabular">Catalogue: 8 cities · 100+ venues · all coordinates real</p>
      </div>
    </footer>
  );
}

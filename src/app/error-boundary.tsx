import { Component, type ErrorInfo, type ReactNode } from 'react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

import { Button } from '@/features/ui';

/**
 * Two error surfaces, because there are two kinds of failure:
 *
 *   `RouteErrorBoundary` — thrown during routing or by a loader. React Router
 *   catches these itself; we only render them.
 *
 *   `AppErrorBoundary` — a render-time throw inside a component subtree. Only
 *   a class component can catch this, which is why one survives here.
 *
 * Both keep the user on a page with a way forward. Neither shows a stack trace
 * in production: it is not actionable for a traveller and it leaks structure.
 */

const IS_DEV = import.meta.env.DEV;

export function RouteErrorBoundary(): React.ReactElement {
  const error = useRouteError();

  const { title, detail } = isRouteErrorResponse(error)
    ? {
        title: error.status === 404 ? 'That page does not exist' : `Error ${String(error.status)}`,
        detail:
          error.status === 404
            ? 'The link may be out of date, or the trip it pointed to was deleted.'
            : error.statusText,
      }
    : {
        title: 'Something broke on our side',
        detail: 'This route failed to load. Your saved trips are untouched.',
      };

  return (
    <ErrorShell title={title} detail={detail} error={error}>
      <Button
        onClick={() => {
          window.location.reload();
        }}
      >
        Reload
      </Button>
      <Link
        to="/"
        className="inline-flex h-11 items-center rounded-md border border-default bg-surface px-5 text-body font-medium text-primary transition-colors hover:bg-surface-hover"
      >
        Back to home
      </Link>
    </ErrorShell>
  );
}

interface AppErrorBoundaryProps {
  children: ReactNode;
  /** Remounts the subtree when this changes — used to reset on navigation. */
  resetKey?: string;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  override componentDidUpdate(previous: AppErrorBoundaryProps): void {
    // Navigating away from a broken route should clear the error, otherwise
    // the boundary pins the user to the failure until a full reload.
    if (this.state.error !== null && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // The single place a real deployment wires up Sentry/Bugsnag.
    console.error('[nocta] uncaught render error', error, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;

    return (
      <ErrorShell
        title="This section stopped responding"
        detail="The rest of the app is still fine. Try again, or head back to the planner."
        error={error}
      >
        <Button
          onClick={() => {
            this.setState({ error: null });
          }}
        >
          Try again
        </Button>
      </ErrorShell>
    );
  }
}

function ErrorShell({
  title,
  detail,
  error,
  children,
}: {
  title: string;
  detail: string;
  error: unknown;
  children: ReactNode;
}): React.ReactElement {
  return (
    <main className="grid min-h-[70svh] place-items-center px-6 py-20">
      <div className="w-full max-w-lg text-center">
        <p className="eyebrow">Error</p>
        <h1 className="mt-3 text-h1 text-primary">{title}</h1>
        <p className="mx-auto mt-4 max-w-prose text-body text-secondary">{detail}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>

        {IS_DEV && error instanceof Error ? (
          <pre className="mt-10 max-h-64 overflow-auto rounded-md border border-subtle bg-surface-sunken p-4 text-left font-mono text-xs text-tertiary">
            {error.stack ?? error.message}
          </pre>
        ) : null}
      </div>
    </main>
  );
}

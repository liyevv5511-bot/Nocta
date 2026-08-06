import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

import { Button } from '@/features/ui';
import { IS_DEV } from '@/lib/env';

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

export function RouteErrorBoundary(): React.ReactElement {
  const { t } = useTranslation();
  const error = useRouteError();

  const { title, detail } = isRouteErrorResponse(error)
    ? {
        title:
          error.status === 404
            ? t('errors.routeMissing')
            : t('errors.status', { status: error.status }),
        detail: error.status === 404 ? t('errors.routeMissingBody') : error.statusText,
      }
    : { title: t('errors.routeBroken'), detail: t('errors.routeBrokenBody') };

  return (
    <ErrorShell title={title} detail={detail} error={error}>
      <Button
        onClick={() => {
          window.location.reload();
        }}
      >
        {t('common.reload')}
      </Button>
      <Link
        to="/"
        className="inline-flex h-11 items-center rounded-md border border-default bg-surface px-5 text-body font-medium text-primary transition-colors hover:bg-surface-hover"
      >
        {t('common.backHome')}
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
        titleKey="errors.sectionBroken"
        detailKey="errors.sectionBrokenBody"
        error={error}
      >
        <ResetButton
          onReset={() => {
            this.setState({ error: null });
          }}
        />
      </ErrorShell>
    );
  }
}

/**
 * A class component cannot call hooks, so the boundary passes keys down and
 * this shell — a function component — does the translating.
 */
function ErrorShell({
  title,
  detail,
  titleKey,
  detailKey,
  error,
  children,
}: {
  title?: string;
  detail?: string;
  titleKey?: 'errors.sectionBroken';
  detailKey?: 'errors.sectionBrokenBody';
  error: unknown;
  children: ReactNode;
}): React.ReactElement {
  const { t } = useTranslation();

  return (
    <main className="grid min-h-[70svh] place-items-center px-6 py-20">
      <div className="w-full max-w-lg text-center">
        <p className="eyebrow">{t('errors.eyebrow')}</p>
        <h1 className="mt-3 text-h1 text-primary">{title ?? (titleKey ? t(titleKey) : '')}</h1>
        <p className="mx-auto mt-4 max-w-prose text-body text-secondary">
          {detail ?? (detailKey ? t(detailKey) : '')}
        </p>

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

/** The reset control, split out so it can use a hook the boundary cannot. */
function ResetButton({ onReset }: { onReset: () => void }): React.ReactElement {
  const { t } = useTranslation();
  return <Button onClick={onReset}>{t('common.tryAgain')}</Button>;
}

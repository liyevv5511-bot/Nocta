/**
 * Transport-level types shared by every async surface in the app.
 *
 * `AsyncState` is deliberately a discriminated union rather than a bag of
 * booleans: `isLoading && error` is not a state this product can be in, and
 * the type system should say so. Every consumer is then forced to render the
 * empty, loading, error and offline branches — which is the actual
 * requirement, not a nicety.
 */

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export type AsyncState<TData, TError = ApiError> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: TData }
  | { status: 'error'; error: TError };

export const ASYNC_IDLE = { status: 'idle' } as const;
export const ASYNC_LOADING = { status: 'loading' } as const;

export type ApiErrorKind =
  | 'network'
  | 'offline'
  | 'timeout'
  | 'aborted'
  | 'validation'
  | 'not_found'
  | 'rate_limited'
  | 'server';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** Whether offering the user a "try again" button makes sense. */
  readonly retryable: boolean;
  override readonly cause: unknown;

  constructor(kind: ApiErrorKind, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.cause = options?.cause;
    this.retryable = kind !== 'validation' && kind !== 'not_found' && kind !== 'aborted';
  }

  /** Copy suitable for showing to a traveller, not to an engineer. */
  get userMessage(): string {
    switch (this.kind) {
      case 'offline':
        return 'You appear to be offline. Your saved trips are still available.';
      case 'network':
        return 'We could not reach the planner. Check your connection and try again.';
      case 'timeout':
        return 'The planner took too long to respond. Try again in a moment.';
      case 'aborted':
        return 'Generation cancelled.';
      case 'validation':
        return 'The planner returned something we could not read. This one is on us.';
      case 'not_found':
        return 'We could not find that trip. It may have been deleted.';
      case 'rate_limited':
        return 'Too many plans at once. Give it a minute and try again.';
      case 'server':
        return 'The planner hit an error. We have logged it — please try again.';
    }
  }
}

/** Type guard used at catch sites, which receive `unknown`. */
export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/** Normalises anything thrown inside a request into an `ApiError`. */
export function toApiError(value: unknown): ApiError {
  if (isApiError(value)) return value;

  if (value instanceof DOMException && value.name === 'AbortError') {
    return new ApiError('aborted', 'Request aborted', { cause: value });
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return new ApiError('offline', 'Browser is offline', { cause: value });
  }

  if (value instanceof TypeError) {
    return new ApiError('network', value.message, { cause: value });
  }

  return new ApiError('server', value instanceof Error ? value.message : 'Unexpected error', {
    cause: value,
  });
}

/**
 * Build-environment flags, read safely.
 *
 * `import.meta.env` is injected by Vite. The prerenderer runs the same
 * component tree under plain Node, where it does not exist at all — reading
 * `.DEV` off it directly throws before the first route renders. The cast plus
 * optional chain is the whole fix, and it lives here so no component has to
 * think about it.
 */
const meta = import.meta as { env?: { DEV?: boolean; PROD?: boolean } };

export const IS_DEV: boolean = meta.env?.DEV ?? false;
export const IS_PRERENDER: boolean = typeof window === 'undefined';

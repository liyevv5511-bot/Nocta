import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import {
  createServer,
  request as httpRequest,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

/**
 * Static server for the E2E suite.
 *
 * `vite preview` was the obvious choice and it is the wrong one: it does not
 * resolve `/destination/lisbon` to `dist/destination/lisbon/index.html`, so
 * every prerendered page fell through to the SPA fallback and the suite
 * silently tested the landing page eleven times over. The tests passed. The
 * prerendering was doing nothing.
 *
 * This implements the same three rules `vercel.json` and `netlify.toml`
 * declare, so what the suite exercises is what a host would actually serve:
 *
 *   1. A path with an extension is a file. Serve it, or 404 — never rewrite it
 *      to `index.html`, which is how a missing JS chunk ends up delivered as
 *      HTML and fails with a syntax error instead of a clear 404.
 *   2. An extensionless path resolves to `<path>/index.html` when one exists.
 *      This is what makes prerendering visible to a visitor.
 *   3. Anything left over falls back to `index.html` for the client router.
 */

const ROOT = resolve(process.cwd(), 'dist');
const PORT = Number(process.env.PORT ?? 4173);
const API_ORIGIN = new URL(process.env.NOCTA_API_ORIGIN ?? 'http://localhost:8787');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

function send(res: ServerResponse, status: number, path: string): void {
  const type = MIME[extname(path)] ?? 'application/octet-stream';

  res.writeHead(status, {
    'Content-Type': type,
    // Hashed assets are immutable; documents must never be cached, or a
    // deploy leaves visitors on a stale shell pointing at deleted chunks.
    'Cache-Control': path.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });

  createReadStream(path).pipe(res);
}

/** Forwards `/api/*` to the planner, streaming the response body through. */
function proxyApi(req: IncomingMessage, res: ServerResponse): void {
  const upstream = httpRequest(
    {
      hostname: API_ORIGIN.hostname,
      port: API_ORIGIN.port,
      path: req.url,
      method: req.method ?? 'GET',
      headers: { ...req.headers, host: API_ORIGIN.host },
    },
    (proxied) => {
      res.writeHead(proxied.statusCode ?? 502, proxied.headers);
      proxied.pipe(res);
    },
  );

  upstream.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'planner_unreachable' }));
  });

  req.pipe(upstream);
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${String(PORT)}`);

  if (url.pathname.startsWith('/api/')) {
    proxyApi(req, res);
    return;
  }

  // `normalize` collapses `..`; the prefix check then rejects anything that
  // still escaped the root.
  const requested = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  const candidate = join(ROOT, requested);

  if (!candidate.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  void (async () => {
    if (extname(requested) !== '') {
      if (await isFile(candidate)) send(res, 200, candidate);
      else res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
      return;
    }

    const indexFile = join(candidate, 'index.html');
    if (await isFile(indexFile)) {
      send(res, 200, indexFile);
      return;
    }

    // SPA fallback: 200, because the client router will render the right page
    // (including its own 404) and a hard 404 would break deep links.
    send(res, 200, join(ROOT, 'index.html'));
  })();
});

server.listen(PORT, () => {
  console.log(`[serve] dist on http://localhost:${String(PORT)} (host-equivalent routing)`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => {
      process.exit(0);
    });
  });
}

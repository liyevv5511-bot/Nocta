import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

import { resolveSiteUrl } from './src/config/site';

const API_TARGET = process.env.NOCTA_API_ORIGIN ?? 'http://localhost:8787';

export default defineConfig({
  // The canonical origin, baked in as a literal so the client needs no
  // environment lookup. Resolved from the deployment rather than hardcoded —
  // see `scripts/siteUrl.ts`.
  define: {
    __SITE_URL__: JSON.stringify(resolveSiteUrl()),
  },
  plugins: [
    react(),
    tailwindcss(),
    // Opt-in: the treemap is a debugging artefact, and emitting it by default
    // publishes a map of the bundle to every visitor at /stats.html.
    // `ANALYZE=1 npm run build` when you want it.
    process.env.ANALYZE === '1'
      ? visualizer({
          filename: 'dist/stats.html',
          gzipSize: true,
          brotliSize: true,
          template: 'treemap',
        })
      : null,
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // The mock-AI service runs standalone so swapping it for a real LLM
      // gateway is a proxy-target change, not a client change.
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
  preview: {
    // The E2E suite runs against the production build, which still needs the
    // planner reachable on the same origin.
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
    },
  },
  build: {
    target: 'es2022',
    cssTarget: 'chrome111',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Split by package path rather than by entry name: `react-dom/client`
        // and `react-dom` are different module ids, and listing only the
        // latter silently leaves the 130kb renderer in the entry chunk.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router)/.test(id)) {
            return 'react';
          }
          if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)/.test(id)) {
            return 'motion';
          }
          if (/[\\/]node_modules[\\/](gsap)/.test(id)) return 'gsap';
          if (/[\\/]node_modules[\\/](zod)/.test(id)) return 'schema';
          return undefined;
        },
      },
    },
  },
});

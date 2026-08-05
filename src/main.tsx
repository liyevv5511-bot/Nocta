import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource-variable/inter';
import './styles/globals.css';

import { AppProviders } from './app/providers';

const container = document.getElementById('root');

// A missing root is a build/deploy failure, not a runtime condition to recover
// from — fail loudly rather than rendering into a detached node.
if (!container) {
  throw new Error('Nocta: #root is missing from index.html');
}

createRoot(container).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
);

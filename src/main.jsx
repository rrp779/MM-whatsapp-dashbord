import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import branding from '../branding';
import App from './App.jsx';
import './index.css';

// Apply branding: CSS variables (colors from primaryPalette + semantic), document title, favicon
function applyBranding() {
  const c = branding.colors;
  const vars = {
    '--color-primary': c.primary,
    '--color-primary-hover': c.primaryHover,
    '--color-primary-muted': c.primaryMuted,
    '--color-primary-50': c.primaryPalette['50'],
    '--color-primary-100': c.primaryPalette['100'],
    '--color-primary-200': c.primaryPalette['200'],
    '--color-primary-300': c.primaryPalette['300'],
    '--color-primary-400': c.primaryPalette['400'],
    '--color-primary-500': c.primaryPalette['500'],
    '--color-primary-600': c.primaryPalette['600'],
    '--color-primary-700': c.primaryPalette['700'],
    '--color-primary-800': c.primaryPalette['800'],
    '--color-primary-900': c.primaryPalette['900'],
    '--color-background': c.background,
    '--color-surface': c.surface,
    '--color-surface-elevated': c.surfaceElevated,
    '--color-text': c.text,
    '--color-text-muted': c.textMuted,
    '--color-border': c.border,
    '--color-success': c.success,
    '--color-warning': c.warning,
    '--color-error': c.error,
  };
  Object.entries(vars).forEach(([k, v]) => {
    document.documentElement.style.setProperty(k, v);
  });

  document.title = branding.metadata.title;
  const favicon = branding.metadata.favicon || '/favicon.ico';
  let link = document.querySelector("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = favicon;
}

applyBranding();

import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);

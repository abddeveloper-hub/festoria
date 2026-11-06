import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Ensure localStorage or query indicates admin view
if (!window.location.pathname.includes('admin')) {
  // If loaded here, ensure admin context
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialTab="dashboard" />
  </StrictMode>,
);

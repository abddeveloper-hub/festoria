import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

try {
  localStorage.setItem('festflow_portal', 'participant');
  localStorage.removeItem('festflow_scores');
  localStorage.removeItem('festflow_results');
} catch (e) {
  // ignore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


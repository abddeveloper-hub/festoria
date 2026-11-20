import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Purge any stale local scores or results to ensure pure cloud Firestore authority
try {
  localStorage.removeItem('festflow_scores');
  localStorage.removeItem('festflow_results');
} catch {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

window.onerror = function (message, source, lineno, colno, error) {
  console.error(message, error);
  alert(message);
};

window.onunhandledrejection = function (event) {
  console.error(event.reason);
  alert(event.reason?.message || "error: check the console");
};


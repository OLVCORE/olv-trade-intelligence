import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// SPEC #005.D.1 — Boot Echo (diagnóstico de flag)
/* eslint-disable no-console */
if (typeof import.meta !== 'undefined') {
  console.log('[DIAG][BOOT] VITE_DEBUG_SAVEBAR =', (import.meta as any)?.env?.VITE_DEBUG_SAVEBAR);
  console.log('[DIAG][BOOT] VITE_DISABLE_AUTO_DISCOVERY =', (import.meta as any)?.env?.VITE_DISABLE_AUTO_DISCOVERY);
}
/* eslint-enable no-console */

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

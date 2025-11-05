import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logFlagsOnBoot } from "./lib/flags";

// SPEC #SAFE-00 — Boot Echo (flags de proteção e diagnóstico)
/* eslint-disable no-console */
logFlagsOnBoot();
/* eslint-enable no-console */

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

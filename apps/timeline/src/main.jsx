import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AppErrorBoundary from "./AppErrorBoundary.jsx";
import "./index.css";

function reportAppError(error, info) {
  const payload = { error, info, source: "main-entry" };

  if (typeof window !== "undefined") {
    const globalReporter = window.__TIMELINE_REPORT_ERROR__;
    if (typeof globalReporter === "function") {
      globalReporter(payload);
    } else {
      window.dispatchEvent(
        new CustomEvent("timeline:app-error", { detail: payload })
      );
    }
  }

}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary onError={reportAppError}>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);

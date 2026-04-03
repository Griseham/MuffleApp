import { Component } from "react";

function defaultErrorReporter(error, info) {
  if (typeof window !== "undefined") {
    const globalReporter = window.__TIMELINE_REPORT_ERROR__;
    if (typeof globalReporter === "function") {
      globalReporter({ error, info, source: "react-error-boundary" });
      return;
    }

    window.dispatchEvent(
      new CustomEvent("timeline:app-error", {
        detail: { error, info, source: "react-error-boundary" },
      })
    );
  }

}

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    const reporter = this.props.onError || defaultErrorReporter;
    reporter(error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main
          role="alert"
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background: "#0d0f17",
            color: "#f4f6ff",
            fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
            textAlign: "center",
          }}
        >
          <section style={{ maxWidth: "560px" }}>
            <h1 style={{ marginBottom: "12px" }}>Timeline failed to load</h1>
            <p style={{ opacity: 0.88, marginBottom: "20px" }}>
              An unexpected error occurred while rendering the app.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                border: 0,
                borderRadius: "10px",
                padding: "10px 14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload app
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

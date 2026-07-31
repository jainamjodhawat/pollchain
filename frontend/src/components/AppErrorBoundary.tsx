import { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "react_error_boundary",
        message: error.message,
        route: window.location.pathname,
        componentStack: info.componentStack,
        timestamp: new Date().toISOString(),
      })
    );
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="page-wrapper">
        <section className="container">
          <div className="empty-state" role="alert">
            <div className="empty-state-icon" aria-hidden="true">
              !
            </div>
            <h1 className="empty-state-title">PollChain hit an unexpected error</h1>
            <p className="empty-state-desc">
              Your wallet and on-chain funds are safe. Reload the application
              to retry the latest network request.
            </p>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => window.location.reload()}
            >
              Reload PollChain
            </button>
          </div>
        </section>
      </main>
    );
  }
}

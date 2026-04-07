import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { ERROR } from "@/locales/en";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <div className="error-icon">{ERROR.crashIcon}</div>
          <div className="error-title">{ERROR.crashTitle}</div>
          <div className="error-body">{ERROR.crashBody}</div>
          <button className="error-action" onClick={this.handleRefresh}>
            {ERROR.refresh}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

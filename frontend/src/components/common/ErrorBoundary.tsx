import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from './States';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="panel">
          <ErrorState message={`This page failed to render: ${this.state.error.message}`} onRetry={() => this.setState({ error: null })} />
        </div>
      );
    }
    return this.props.children;
  }
}

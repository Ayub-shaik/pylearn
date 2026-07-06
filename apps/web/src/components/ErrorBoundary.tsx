import { Component } from 'react';
import type { ErrorInfo, ReactElement, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Last-resort catch for render errors — without this, an uncaught exception
 * anywhere in the tree unmounts the whole app to a blank white page with no
 * way to recover except manually navigating away and back.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled render error', error, info.componentStack);
  }

  handleReload = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode | ReactElement {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
          <div className="card max-w-md space-y-4 p-6 text-center">
            <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
            <p className="text-sm text-slate-300">
              PyLearn hit an unexpected error and couldn&apos;t continue rendering this page. Your
              progress is saved — reloading should get you back on track.
            </p>
            <button type="button" className="btn btn-primary" onClick={this.handleReload}>
              Reload PyLearn
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

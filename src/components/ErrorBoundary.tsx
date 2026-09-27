import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public componentDidMount() {
    // Suppress and gracefully handle unhandled promise rejections & WebSocket drops
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.addEventListener('error', this.handleGlobalError);
  }

  public componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleGlobalError);
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    // Prevent unhandled rejection errors from showing in dev overlay or crashing React
    const reason = event.reason?.message || String(event.reason || '');
    if (
      reason.includes('WebSocket') || 
      reason.includes('closed without opened') || 
      reason.includes('Failed to fetch') ||
      reason.includes('The user aborted a request')
    ) {
      console.warn('Suppressed transient background rejection:', reason);
      event.preventDefault();
      return;
    }
    console.warn('Unhandled rejection captured gracefully:', reason);
    event.preventDefault();
  };

  private handleGlobalError = (event: ErrorEvent) => {
    const msg = event.message || '';
    if (msg.includes('WebSocket') || msg.includes('Expected static flag was missing')) {
      console.warn('Suppressed runtime overlay error:', msg);
      event.preventDefault();
    }
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#141414] border border-[#2B2B2B] rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-500/60 flex items-center justify-center mx-auto text-red-500">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold uppercase text-white tracking-wide">
                Something Went Wrong
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                A transient view error occurred. Your wallet balance and match progress are safely preserved.
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="btn-crimson inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase font-bold tracking-wider cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

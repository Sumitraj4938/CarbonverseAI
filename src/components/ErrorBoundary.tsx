import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error at ErrorBoundary boundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-[#0B130E]/80 border border-red-500/15 rounded-2xl shadow-2xl backdrop-blur-md text-center max-w-2xl mx-auto my-12" id="error-boundary-view">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 font-display">System Boundary Intercept</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md font-mono leading-relaxed">
            An unexpected render thread crash occurred. This is caught and contained securely by the system error sandbox.
          </p>
          {this.state.error && (
            <div className="bg-black/40 border border-red-500/10 p-3.5 rounded-xl font-mono text-xs text-red-350 max-w-lg mb-6 text-left break-words overflow-x-auto w-full">
              {this.state.error.message}
            </div>
          )}
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-650 hover:to-amber-650 text-white font-bold text-xs font-mono uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg shadow-red-500/10 active:scale-95"
            id="error-reset-button"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restore Active Context</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

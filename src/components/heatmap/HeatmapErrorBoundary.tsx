import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class HeatmapErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    console.error('🚨 Heatmap Error Boundary caught error:', error);
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Heatmap Error Details:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed top-4 right-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-md shadow-lg z-50">
          <div className="text-red-800 dark:text-red-200 font-medium text-sm mb-2">
            🚨 Heatmap Error
          </div>
          <div className="text-red-700 dark:text-red-300 text-xs mb-3">
            The heatmap system encountered an error and has been disabled to prevent page crashes.
          </div>
          <div className="text-red-600 dark:text-red-400 text-xs font-mono bg-red-100 dark:bg-red-900/40 p-2 rounded mb-3 max-h-32 overflow-y-auto">
            {this.state.error?.message || 'Unknown error'}
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: undefined, errorInfo: undefined });
              window.location.reload();
            }}
            className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default HeatmapErrorBoundary;
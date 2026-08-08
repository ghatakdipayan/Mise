import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled error in Mise:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-[#fbf7f0] p-6">
          <div className="max-w-[360px] text-center flex flex-col items-center gap-4">
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#b4791f' }}>
              error
            </span>
            <h1 className="font-head text-[20px] font-bold text-[#15201a]">Something went wrong</h1>
            <p className="text-[14px] text-[#717c75]">
              Mise hit an unexpected error. Reloading usually fixes it — your pantry and plan are saved locally.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-1 px-6 py-2.5 rounded-full bg-[#15a85b] text-white font-bold text-[14.5px] border-none cursor-pointer"
            >
              Reload Mise
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

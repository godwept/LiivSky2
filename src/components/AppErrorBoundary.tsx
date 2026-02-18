import { Component, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    console.error('App render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.9)',
          padding: '1.25rem',
          textAlign: 'center',
        }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', marginBottom: '0.6rem' }}>Something went wrong</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>Please refresh the page.</p>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
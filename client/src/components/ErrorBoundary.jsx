import { Component } from 'react';

// Catches render errors so a crash shows a friendly message instead of a blank page.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="eyebrow">Something went wrong</p>
          <h1 className="text-4xl">Sorry, this page failed to load.</h1>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-11 rounded-full bg-crust px-6 font-medium text-surface transition duration-200 hover:bg-crust-hover"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

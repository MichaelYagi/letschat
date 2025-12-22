import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console for debugging
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
          <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-6'>
            <div className='flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4'>
              <AlertTriangle className='w-6 h-6 text-red-600' />
            </div>

            <h2 className='text-xl font-semibold text-gray-900 text-center mb-2'>
              Something went wrong
            </h2>

            <p className='text-gray-600 text-center mb-6'>
              An unexpected error occurred. Please try refreshing the page.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className='mb-6 p-4 bg-gray-100 rounded-lg text-sm'>
                <summary className='font-medium text-gray-700 cursor-pointer mb-2'>
                  Error details (development only)
                </summary>
                <pre className='text-red-600 whitespace-pre-wrap'>
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre className='text-gray-600 mt-2 whitespace-pre-wrap'>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <div className='flex gap-3'>
              <button
                onClick={this.handleReset}
                className='flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors'
              >
                <RefreshCw size={16} />
                Try again
              </button>

              <button
                onClick={() => window.location.reload()}
                className='flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors'
              >
                Refresh page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

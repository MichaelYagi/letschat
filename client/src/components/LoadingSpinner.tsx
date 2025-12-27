import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({
  size = 'md',
  className = '',
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2
        className={`${sizeClasses[size]} animate-spin text-primary-600`}
      />
      {text && <span className='ml-2 text-sm text-gray-600'>{text}</span>}
    </div>
  );
}

interface LoadingStateProps {
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export function LoadingState({
  loading,
  error,
  children,
  fallback,
  errorFallback,
}: LoadingStateProps) {
  if (loading) {
    return (
      fallback || (
        <div className='flex items-center justify-center p-8'>
          <LoadingSpinner size='lg' text='Loading...' />
        </div>
      )
    );
  }

  if (error) {
    return (
      errorFallback || (
        <div className='flex items-center justify-center p-8'>
          <div className='text-center'>
            <div className='text-red-500 text-sm font-medium mb-2'>Error</div>
            <div className='text-gray-600 text-sm'>{error}</div>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}

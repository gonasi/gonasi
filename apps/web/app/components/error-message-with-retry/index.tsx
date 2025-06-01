interface ErrorMessageWithRetryProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorMessageWithRetry: React.FC<ErrorMessageWithRetryProps> = ({
  message = 'Could not load courses 😬',
  onRetry = () => window.location.reload(),
}) => {
  return (
    <div className='py-8 text-center'>
      <p className='mb-4 text-red-600'>{message}</p>
      <button
        onClick={onRetry}
        className='rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'
      >
        Try Again
      </button>
    </div>
  );
};

import { CircleX, ExternalLink, LoaderCircle } from 'lucide-react';

import GoParsedContent from '~/components/ui/forms/elements/GoParsedContent';
import { cn } from '~/lib/utils';

interface GoValidationStatusMessageProps {
  message: string;
  loading?: boolean;
  fixLink?: string;
  disabled?: boolean;
  className?: string;
}

export function GoValidationStatusMessage({
  message,
  loading = false,
  fixLink,
  disabled = false,
  className,
}: GoValidationStatusMessageProps) {
  const content = (
    <div className='flex items-start space-x-2'>
      <div className='pt-1'>
        {loading ? (
          <LoaderCircle size={16} className='flex-shrink-0 animate-spin' />
        ) : (
          <CircleX size={16} className='text-danger flex-shrink-0' />
        )}
      </div>
      <p>
        <GoParsedContent html={message ?? ''} variant='overview' />
        {fixLink && <ExternalLink size={12} className='-mt-4 inline' />}
      </p>
    </div>
  );

  if (fixLink) {
    return (
      <a
        href={fixLink}
        target='_blank'
        rel='noopener noreferrer'
        className={cn(
          'font-secondary p2 flex items-center justify-between',
          'text-danger',
          'hover:underline',
          disabled && 'pointer-events-none opacity-50',
          className,
        )}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className={cn(
        'font-secondary p2 flex items-start space-x-2',
        'text-danger',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      {content}
    </div>
  );
}

import * as React from 'react';

import { cn } from '~/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  errorMessage?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, errorMessage, disabled, ...props }, ref) => {
    return (
      <div className={cn('relative', disabled && 'opacity-50')}>
        <textarea
          className={cn(
            'bg-background flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm transition-colors',
            'placeholder:text-muted-foreground placeholder:font-secondary placeholder:font-light placeholder:opacity-60',
            'font-secondary text-foreground',
            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-danger text-danger focus-visible:ring-danger'
              : 'border-input text-foreground',
            disabled && 'hover:border-input',
            className,
          )}
          ref={ref}
          disabled={disabled}
          {...props}
        />
        {error && errorMessage && (
          <p className={cn('text-danger font-secondary mt-1 text-xs', disabled && 'opacity-50')}>
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export { Textarea };

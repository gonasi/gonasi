import * as React from 'react';
import { FolderIcon } from 'lucide-react';

import { cn } from '~/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  error?: boolean;
  errorMessage?: string;
  wrapperClass?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      wrapperClass,
      type,
      leftIcon,
      rightIcon,
      onRightIconClick,
      error,
      errorMessage,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isFileInput = type === 'file';
    const [fileName, setFileName] = React.useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      setFileName(file ? file.name : null);
      if (props.onChange) {
        props.onChange(event);
      }
    };

    return (
      <div className={`relative ${wrapperClass}`}>
        <div className={cn('relative', isFileInput && 'group')}>
          {isFileInput ? (
            <label
              htmlFor={props.id || 'file-input'}
              className={cn(
                'bg-background flex h-12 w-full items-center justify-center rounded-md border px-3 py-2 text-sm transition-colors',
                'font-secondary text-foreground',
                'hover:bg-muted',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
                error ? 'border-danger text-danger' : 'border-input',
                disabled ? 'hover:bg-background cursor-not-allowed opacity-50' : 'cursor-pointer',
                className,
              )}
            >
              <FolderIcon className={cn('mr-2 h-5 w-5 flex-shrink-0', disabled && 'opacity-50')} />
              {fileName || props.placeholder || 'Choose file'}
            </label>
          ) : (
            <>
              {leftIcon && (
                <div
                  className={cn(
                    'text-muted-foreground pointer-events-none absolute top-1/2 left-3 flex -translate-y-1/2 items-center',
                    disabled && 'opacity-50',
                  )}
                >
                  {leftIcon}
                </div>
              )}
              <input
                type={type}
                className={cn(
                  'bg-background flex h-12 w-full rounded-md border px-3 py-2 text-sm transition-colors',
                  'placeholder:text-muted-foreground placeholder:font-secondary placeholder:font-light placeholder:opacity-60',
                  'font-secondary text-foreground',
                  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  leftIcon && 'pl-10',
                  rightIcon && 'pr-10',
                  error
                    ? 'border-danger text-danger focus-visible:ring-danger'
                    : 'border-input text-foreground',
                  className,
                )}
                disabled={disabled}
                ref={ref}
                {...props}
              />
              {rightIcon && (
                <button
                  type='button'
                  onClick={onRightIconClick}
                  disabled={disabled}
                  className={cn(
                    'text-muted-foreground pointer-events-auto absolute top-1/2 right-3 flex -translate-y-1/2 items-center',
                    disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                  )}
                >
                  {rightIcon}
                </button>
              )}
            </>
          )}
        </div>
        {isFileInput && (
          <input
            id={props.id || 'file-input'}
            type='file'
            className='sr-only'
            disabled={disabled}
            ref={ref}
            onChange={handleFileChange}
            {...props}
          />
        )}
        {error && errorMessage && (
          <p className='text-danger font-secondary mt-1 text-xs'>{errorMessage}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };

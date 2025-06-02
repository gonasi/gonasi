import { Controller } from 'react-hook-form';
import { useRemixFormContext } from 'remix-hook-form';

import { Input, type InputProps } from '../../input';
import { Label, type LabelProps } from '../../label';
import { ErrorDisplay, FormDescription } from './Common';

interface GoInputFieldProps {
  name: string;
  prefix?: string;
  description?: string;
  className?: string;
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  inputProps?: Omit<InputProps, 'error' | 'aria-invalid' | 'aria-describedby'>;
}

export function GoFileField({
  name,
  prefix,
  description,
  className,
  labelProps,
  inputProps,
}: GoInputFieldProps) {
  const {
    control,
    formState: { errors },
  } = useRemixFormContext();

  const id = name;
  const descriptionId = `${id}-description`;
  const error = errors[name];
  const hasError = !!error;
  const errorMessage = error?.message?.toString() || 'This field has an error';

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, onBlur, name: fieldName, ref, value } }) => {
        // Get the current file name for display
        const currentFileName = value instanceof File ? value.name : null;

        return (
          <div className={className}>
            <Label htmlFor={id} error={hasError} {...labelProps} />
            <div className='flex w-full items-center'>
              {prefix && (
                <span className='bg-muted font-secondary mr-2 flex h-12 flex-shrink-0 items-center justify-center rounded-md px-2'>
                  {prefix}
                </span>
              )}
              <Input
                id={id}
                name={fieldName}
                ref={ref}
                wrapperClass='flex-grow min-w-0'
                aria-invalid={hasError}
                aria-describedby={description ? descriptionId : undefined}
                error={hasError}
                {...inputProps}
                type='file'
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  onChange(file);
                  // Call the original onChange if it exists
                  if (inputProps?.onChange) {
                    inputProps.onChange(e);
                  }
                }}
                onBlur={onBlur}
                placeholder={currentFileName || 'Choose a file...'}
              />
            </div>
            <div className='min-h-[32px] pt-1 pb-3'>
              {hasError && errorMessage && <ErrorDisplay error={errorMessage} />}
              {description && <FormDescription id={descriptionId}>{description}</FormDescription>}
            </div>
          </div>
        );
      }}
    />
  );
}

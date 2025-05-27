import { Controller } from 'react-hook-form';
import { useRemixFormContext } from 'remix-hook-form';

import { Label, type LabelProps } from '../../label';
import { Textarea, type TextareaProps } from '../../textarea';
import { ErrorDisplay, FormDescription } from './Common';

interface GoTextAreaFieldProps {
  name: string;
  description?: string;
  className?: string;
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  textareaProps: Omit<TextareaProps, 'error' | 'aria-invalid' | 'aria-describedby'>;
}

export function GoTextAreaField({
  name,
  description,
  className,
  labelProps,
  textareaProps,
}: GoTextAreaFieldProps) {
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
      render={({ field }) => (
        <div className={className}>
          <Label htmlFor={id} error={hasError} {...labelProps} />
          <Textarea
            id={id}
            aria-invalid={hasError}
            aria-describedby={description ? descriptionId : undefined}
            error={hasError}
            {...field}
            {...textareaProps}
          />
          <div className='min-h-[32px] pt-1 pb-3'>
            {hasError && errorMessage && <ErrorDisplay error={errorMessage} />}
            {description && <FormDescription id={descriptionId}>{description}</FormDescription>}
          </div>
        </div>
      )}
    />
  );
}

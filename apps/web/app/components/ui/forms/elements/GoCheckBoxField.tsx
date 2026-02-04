import { Controller } from 'react-hook-form';
import { useRemixFormContext } from 'remix-hook-form';

import { Checkbox, type CheckboxProps } from '../../checkbox';
import { Label, type LabelProps } from '../../label';
import { ErrorDisplay, FormDescription } from './Common';

interface GoCheckBoxFieldProps {
  name: string;
  description?: string;
  className?: string;
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  checkboxProps?: Omit<CheckboxProps, 'error' | 'aria-invalid' | 'aria-describedby' | 'type'>;
  disabled?: boolean;
}

export function GoCheckBoxField({
  name,
  description,
  className,
  labelProps,
  checkboxProps,
  disabled = false,
}: GoCheckBoxFieldProps) {
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
      render={({ field: { onChange, onBlur, value, ref } }) => (
        <div className={className}>
          <div className='flex items-center gap-2'>
            <Checkbox
              id={id}
              ref={ref}
              checked={!!value}
              onCheckedChange={onChange}
              onBlur={onBlur}
              disabled={disabled}
              aria-invalid={hasError}
              aria-describedby={description ? descriptionId : undefined}
              {...checkboxProps}
            />
            <Label htmlFor={id} error={hasError} {...labelProps} />
          </div>
          <div className='min-h-[32px] pt-1 pb-3'>
            {hasError && errorMessage && <ErrorDisplay error={errorMessage} />}
            {description && <FormDescription id={descriptionId}>{description}</FormDescription>}
          </div>
        </div>
      )}
    />
  );
}

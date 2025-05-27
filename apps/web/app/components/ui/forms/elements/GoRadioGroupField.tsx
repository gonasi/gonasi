import { Controller } from 'react-hook-form';
import { useRemixFormContext } from 'remix-hook-form';

import { Label, type LabelProps } from '../../label';
import { RadioGroup, RadioGroupItem } from '../../radio-group';
import { ErrorDisplay, FormDescription } from './Common';

export interface RadioOption {
  value: string;
  label: string | number;
}

interface GoRadioGroupFieldProps {
  name: string;
  description?: string;
  className?: string;
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  options: RadioOption[];
}

export function GoRadioGroupField({
  name,
  description,
  className,
  labelProps,
  options,
}: GoRadioGroupFieldProps) {
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
          <RadioGroup
            id={id}
            aria-invalid={hasError}
            aria-describedby={description ? descriptionId : undefined}
            onValueChange={(value) => {
              field.onChange(value);
            }}
            error={hasError}
            {...field}
          >
            {options.map((option) => (
              <div key={option.value} className='flex h-full items-center space-x-2'>
                <RadioGroupItem
                  id={`${id}-${option.value}`}
                  value={option.value}
                  error={hasError}
                />
                <Label
                  htmlFor={`${id}-${option.value}`}
                  error={hasError}
                  className='text-body-xs text-muted-foreground cursor-pointer self-center p-0'
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <div className='min-h-[32px] pt-1 pb-3'>
            {hasError && errorMessage && <ErrorDisplay error={errorMessage} />}
            {description && <FormDescription id={descriptionId}>{description}</FormDescription>}
          </div>
        </div>
      )}
    />
  );
}

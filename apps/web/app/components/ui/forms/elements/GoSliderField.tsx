import { Controller } from 'react-hook-form';
import type { SliderProps } from '@radix-ui/react-slider';
import { useRemixFormContext } from 'remix-hook-form';

import { Label, type LabelProps } from '../../label';
import { Slider } from '../../slider';
import { ErrorDisplay, FormDescription, SliderDisplay } from './Common';

interface GoSliderFieldProps {
  name: string;
  description?: string;
  className?: string;
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  sliderProps?: Omit<SliderProps, 'id' | 'value' | 'onValueChange' | 'onFocus' | 'onBlur'>;
  min?: number;
  max?: number;
  // Add option to control if you want single value or array
  returnSingleValue?: boolean;
}

export function GoSliderField({
  name,
  description,
  className,
  labelProps,
  sliderProps,
  min = 0,
  max = 100,
  returnSingleValue = true, // Default to single value for most use cases
}: GoSliderFieldProps) {
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
      defaultValue={returnSingleValue ? min : [min]} // Set default value
      render={({ field }) => {
        // Ensure the value is always an array for the Slider component
        // Always default to min if value is null/undefined/empty
        const sliderValue = Array.isArray(field.value)
          ? field.value
          : field.value !== undefined && field.value !== null
            ? [field.value]
            : [min];

        return (
          <div className={className}>
            <Label
              htmlFor={id}
              error={hasError}
              {...labelProps}
              endAdornment={
                <SliderDisplay sliderValue={sliderValue} returnSingleValue={returnSingleValue} />
              }
            />
            <Slider
              {...sliderProps}
              id={id}
              min={min}
              max={max}
              value={sliderValue} // Always pass array to Slider
              aria-invalid={hasError}
              aria-describedby={description ? descriptionId : undefined}
              onValueChange={(value) => {
                // Transform the value based on returnSingleValue preference
                const transformedValue = returnSingleValue ? value[0] : value;
                field.onChange(transformedValue);
              }}
              onBlur={field.onBlur}
              name={field.name}
            />

            <div className='text-body-2xs text-muted-foreground font-secondary mt-1 flex justify-between px-1 pt-2'>
              <span>{min}</span>
              <span>{max}</span>
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

import { Controller } from 'react-hook-form';
import type { SliderProps } from '@radix-ui/react-slider';
import { useRemixFormContext } from 'remix-hook-form';

import { Label, type LabelProps } from '../../label';
import { Slider } from '../../slider';
import { ErrorDisplay, FormDescription } from './Common';

interface GoRangeSliderFieldProps {
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

export function GoRangeSliderField({
  name,
  description,
  className,
  labelProps,
  sliderProps,
  min = 0,
  max = 100,
}: Omit<GoRangeSliderFieldProps, 'returnSingleValue'>) {
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
      defaultValue={[min, max]} // Set default range from min to max
      render={({ field }) => {
        // For range slider, always expect array of 2 values
        // Default to [min, max] if no valid range is set
        const sliderValue =
          Array.isArray(field.value) && field.value.length === 2 ? field.value : [min, max];

        return (
          <div className={className}>
            <Label htmlFor={id} error={hasError} {...labelProps} />
            <Slider
              {...sliderProps}
              id={id}
              min={min}
              max={max}
              value={sliderValue}
              aria-invalid={hasError}
              aria-describedby={description ? descriptionId : undefined}
              onValueChange={(value) => {
                field.onChange(value); // Return full array for range
              }}
              onBlur={field.onBlur}
              name={field.name}
            />

            {/* Show current range */}
            <div className='mt-2 text-center text-sm font-medium'>
              Range: {sliderValue[0]} - {sliderValue[1]}
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

import { useId } from 'react';
import type { FieldMetadata } from '@conform-to/react';
import { useInputControl } from '@conform-to/react';
import type { SliderProps } from '@radix-ui/react-slider';

import { ErrorList, hasErrors, type ListOfErrors } from './forms';
import { FormDescription } from './forms';

import { Label, type LabelProps } from '~/components/ui/label';
import { Slider } from '~/components/ui/slider';

export function SliderField({
  labelProps,
  sliderProps,
  errors,
  className,
  description,
  meta,
  min = 0,
  max = 100,
}: {
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  sliderProps?: Omit<SliderProps, 'id' | 'value' | 'onValueChange' | 'onFocus' | 'onBlur'>;
  errors?: ListOfErrors;
  className?: string;
  description?: string;
  meta: FieldMetadata<string | number | undefined>;
  min?: number;
  max?: number;
}) {
  const fallbackId = useId();
  const input = useInputControl(meta);

  const id = meta.id ?? meta.name ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  const descriptionId = description ? `${id}-description` : undefined;
  const err = hasErrors(errors);

  // Handle different types of values
  const value =
    typeof meta.value === 'number'
      ? meta.value
      : typeof meta.value === 'string' && meta.value !== ''
        ? Number(meta.value) || 0
        : 0;

  return (
    <div className={className}>
      <div className='mb-2 flex items-center justify-between'>
        <Label htmlFor={id} error={err} {...labelProps} />
        <span className='text-body-xs text-muted-foreground'>{value}</span>
      </div>

      <Slider
        {...sliderProps}
        id={id}
        min={min}
        max={max}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={[errorId, descriptionId].filter(Boolean).join(' ') || undefined}
        value={[value]}
        onValueChange={(newValue) => {
          // Safely handle the value change
          if (newValue && newValue.length > 0) {
            // Convert to string for Conform's input control
            input.change(String(newValue[0]));
          } else {
            input.change('0');
          }
        }}
        onFocus={() => {
          input.focus();
        }}
        onBlur={() => {
          input.blur();
        }}
      />

      <div className='text-body-2xs text-muted-foreground font-secondary mt-1 flex justify-between px-1 pt-2'>
        <span>{min}</span>
        <span>{max}</span>
      </div>

      <div className='min-h-[32px] pt-0 pb-3'>
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
        {description ? <FormDescription id={descriptionId}>{description}</FormDescription> : null}
      </div>
    </div>
  );
}

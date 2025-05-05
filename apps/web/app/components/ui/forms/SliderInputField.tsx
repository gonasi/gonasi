import { useId } from 'react';
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
}: {
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  sliderProps: SliderProps & {
    name: string;
    form: string;
  };
  errors?: ListOfErrors;
  className?: string;
  description?: string;
}) {
  const { key, defaultValue = [0], min = 0, max = 100, ...restSliderProps } = sliderProps;
  const fallbackId = useId();
  const input = useInputControl({
    key,
    name: sliderProps.name,
    formId: sliderProps.form,
    initialValue: defaultValue.map(String),
  });
  const id = sliderProps.id ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  const descriptionId = `${id}-description`;
  const err = hasErrors(errors);

  const value = Array.isArray(input.value) ? Number(input.value[0]) || 0 : Number(input.value) || 0;

  return (
    <div className={className}>
      <div className='mb-2 flex items-center justify-between'>
        <Label
          htmlFor={id}
          error={err}
          {...labelProps}
          className='text-body-xs text-muted-foreground'
        />
        <span className='text-body-xs text-muted-foreground'>{value}</span>
      </div>

      <Slider
        {...restSliderProps}
        id={id}
        min={min}
        max={max}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        value={[value]}
        onValueChange={(newValue) => {
          input.change(newValue.map(String));
          sliderProps.onValueChange?.(newValue);
        }}
        onFocus={(event) => {
          input.focus();
          sliderProps.onFocus?.(event);
        }}
        onBlur={(event) => {
          input.blur();
          sliderProps.onBlur?.(event);
        }}
      />

      <div className='text-body-2xs text-muted-foreground mt-1 flex justify-between'>
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

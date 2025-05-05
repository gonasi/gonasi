import { useId } from 'react';
import { useInputControl } from '@conform-to/react';

import {
  ErrorList,
  FormDescription,
  hasErrors,
  type ListOfErrors,
} from '~/components/ui/forms/forms';
import type { LabelProps } from '~/components/ui/label';
import { Label } from '~/components/ui/label';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';

export interface RadioOption {
  value: string;
  label: string;
}

export function RadioButtonField({
  labelProps,
  field,
  options,
  errors,
  className,
  description,
  ...rest
}: {
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  field: {
    name: string;
    formId: string;
    key?: string;
    initialValue?: string;
    value?: string;
    id?: string;
    onValueChange?: (value: string) => void;
  };
  options: RadioOption[];
  errors?: ListOfErrors;
  className?: string;
  description?: string;
}) {
  const fallbackId = useId();

  const input = useInputControl({
    key: field.key,
    name: field.name,
    formId: field.formId,
    initialValue: field.initialValue,
  });

  const id = field.id ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  const descriptionId = description ? `${id}-description` : undefined;
  const err = hasErrors(errors);

  return (
    <div className={className}>
      {labelProps.children && (
        <Label
          htmlFor={id}
          error={err}
          {...labelProps}
          className='text-body-sm text-foreground mb-2 block font-medium'
        />
      )}
      <RadioGroup
        id={id}
        value={typeof input.value === 'string' ? input.value : ''}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={[errorId, descriptionId].filter(Boolean).join(' ') || undefined}
        onValueChange={(val) => {
          input.change(val);
          field.onValueChange?.(val);
        }}
        onFocus={input.focus}
        onBlur={input.blur}
        error={err}
        {...rest}
      >
        {options.map((option) => (
          <div key={option.value} className='flex h-full items-center space-x-2'>
            <RadioGroupItem id={`${id}-${option.value}`} value={option.value} error={err} />
            <Label
              htmlFor={`${id}-${option.value}`}
              error={err}
              className='text-body-xs text-muted-foreground cursor-pointer self-center p-0'
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>

      <div className='min-h-[32px] pt-1 pb-3'>
        {errorId && <ErrorList id={errorId} errors={errors} />}
        {description && <FormDescription id={descriptionId}>{description}</FormDescription>}
      </div>
    </div>
  );
}

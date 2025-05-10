import { useId } from 'react';
import type { FieldMetadata } from '@conform-to/react';
import { useInputControl } from '@conform-to/react';

import { ErrorList, hasErrors, type ListOfErrors } from './forms';
import { FormDescription } from './forms';

import { Label, type LabelProps } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';

/**
 * SwitchField component that handles both boolean and string form values
 * Always stores values as strings 'true' or 'false' in the form state
 * Can accept initial boolean values and converts them to strings
 */
export function SwitchField({
  labelProps,
  switchProps,
  errors,
  className,
  description,
  meta,
}: {
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  switchProps?: Omit<
    React.ComponentPropsWithoutRef<typeof Switch>,
    'id' | 'checked' | 'onCheckedChange' | 'onFocus' | 'onBlur'
  >;
  errors?: ListOfErrors;
  className?: string;
  description?: string;
  meta: FieldMetadata<string | boolean | undefined>;
}) {
  const fallbackId = useId();
  const input = useInputControl(meta);

  const id = meta.id ?? meta.name ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  const descriptionId = description ? `${id}-description` : undefined;
  const err = hasErrors(errors);

  // Convert initial value to string if it's boolean
  // This ensures component correctly initializes if form field is initially a boolean
  if (typeof meta.initialValue === 'boolean') {
    meta.initialValue = meta.initialValue ? 'true' : 'false';
  }

  // Handle all possible value types safely
  let isChecked = false;
  if (typeof meta.value === 'boolean') {
    isChecked = meta.value;
  } else if (typeof meta.value === 'string') {
    isChecked = meta.value === 'true';
  }

  return (
    <div className={className}>
      <div className='flex gap-2'>
        <Switch
          {...switchProps}
          id={id}
          aria-invalid={errorId ? true : undefined}
          aria-describedby={[errorId, descriptionId].filter(Boolean).join(' ') || undefined}
          checked={isChecked}
          onCheckedChange={(checked) => {
            // Always store as string 'true' or 'false' for consistent handling
            const newValue = checked ? 'true' : 'false';
            input.change(newValue);
          }}
          onFocus={input.focus}
          onBlur={input.blur}
        />
        <Label
          htmlFor={id}
          error={err}
          {...labelProps}
          className='text-body-xs mt-0.5 self-center'
        />
      </div>
      <div className='min-h-[32px] pt-0 pb-3'>
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
        {description ? <FormDescription id={descriptionId}>{description}</FormDescription> : null}
      </div>
    </div>
  );
}

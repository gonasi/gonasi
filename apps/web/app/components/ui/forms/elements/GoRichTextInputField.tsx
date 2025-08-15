import { useRef, useState } from 'react';
import { Controller, get } from 'react-hook-form';
import debounce from 'lodash.debounce';
import { useRemixFormContext } from 'remix-hook-form';

import { Label, type LabelProps } from '../../label';
import { ErrorDisplay, FormDescription } from './Common';

import GoEditor from '~/components/go-editor';

interface GoRichTextInputFieldProps {
  name: string;
  description?: string;
  className?: string;
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  placeholder?: string;
}

export function GoRichTextInputField({
  name,
  description,
  className,
  labelProps,
  placeholder = '',
}: GoRichTextInputFieldProps) {
  const {
    control,
    formState: { errors },
    setValue,
    trigger,
  } = useRemixFormContext();

  const [hasBlurred, setHasBlurred] = useState(false);

  // Debounced validator — triggers after 500ms of no changes
  const debouncedTrigger = useRef(
    debounce((fieldName: string) => {
      trigger(fieldName);
    }, 500),
  ).current;

  const id = name;
  const descriptionId = `${id}-description`;
  const error = get(errors, name);
  const hasError = !!error;
  const errorMessage = error?.message?.toString() || 'This field has an error';

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className={className}>
          <Label htmlFor={id} error={hasError} {...labelProps} />

          {/* Wrapper div to catch blur */}
          <div
            onBlur={() => {
              if (!hasBlurred) {
                setHasBlurred(true);
                trigger(name); // validate immediately on first blur
              }
            }}
          >
            <GoEditor
              editorState={field.value}
              setEditorState={(value) => {
                field.onChange(value);
              }}
              onImmediateChange={(value) => {
                // Always update form state
                setValue(name, value, {
                  shouldDirty: true,
                  shouldValidate: false,
                  shouldTouch: true,
                });

                if (hasBlurred) {
                  // Only run live validation after first blur
                  debouncedTrigger(name);
                }
              }}
              loading={false}
              placeholder={placeholder}
              hasError={hasError}
            />
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

import { lazy, Suspense } from 'react';
import { Controller } from 'react-hook-form';
import { useRemixFormContext } from 'remix-hook-form';

import { Label, type LabelProps } from '../../label';
import { ErrorDisplay, FormDescription } from './Common';

import { Spinner } from '~/components/loaders';

// Lazy import the rich editor
const LazyRichTextInput = lazy(() => import('../../../go-editor'));

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

          <Suspense fallback={<Spinner />}>
            <LazyRichTextInput
              editorState={field.value}
              setEditorState={(value) => {
                field.onChange(value);
              }}
              loading={false}
              placeholder={placeholder}
              hasError={hasError}
            />
          </Suspense>

          <div className='min-h-[32px] pt-1 pb-3'>
            {hasError && errorMessage && <ErrorDisplay error={errorMessage} />}
            {description && <FormDescription id={descriptionId}>{description}</FormDescription>}
          </div>
        </div>
      )}
    />
  );
}

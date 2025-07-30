import { Controller, get } from 'react-hook-form';
import { useRemixFormContext } from 'remix-hook-form';

import { Label, type LabelProps } from '../../label';
import { ErrorDisplay, FormDescription } from './Common';

import GoLexical from '~/components/go-lexical';

interface GoLexicalInputFieldProps {
  name: string;
  description?: string;
  className?: string;
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  placeholder?: string;
}

export function GoLexicalInputField({
  name,
  description,
  className,
  labelProps,
  placeholder = '',
}: GoLexicalInputFieldProps) {
  const {
    control,
    formState: { errors },
  } = useRemixFormContext();

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

          <GoLexical
            editorState={field.value}
            setEditorState={field.onChange}
            placeholder={placeholder}
            hasError={hasError}
            loading={false}
          />

          <div className='min-h-[32px] pt-1 pb-3'>
            {hasError && errorMessage && <ErrorDisplay error={errorMessage} />}
            {description && <FormDescription id={descriptionId}>{description}</FormDescription>}
          </div>
        </div>
      )}
    />
  );
}

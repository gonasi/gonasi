import { Suspense, useId, useState } from 'react';
import type { FieldMetadata } from '@conform-to/react';
import { useInputControl } from '@conform-to/react';

import type { LabelProps } from '../label';
import { Label } from '../label';
import type { ListOfErrors } from './forms';
import { ErrorList, FormDescription, hasErrors } from './forms';

interface RichTextInputFieldProps {
  labelProps: Omit<LabelProps, 'htmlFor' | 'error'>;
  meta: FieldMetadata<string>;
  errors?: ListOfErrors;
  className?: string;
  description?: string;
  placeholder?: string;
}

export function RichTextInputField({
  labelProps,
  errors,
  className,
  description,
  meta,
  placeholder = 'Enter text',
}: RichTextInputFieldProps) {
  const fallbackId = useId();

  const richText = useInputControl(meta);

  const id = meta.id ?? meta.name ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  const descriptionId = description ? `${id}-description` : undefined;
  const err = hasErrors(errors);

  // Create a state to track the editor content
  const [editorContent, setEditorContent] = useState(meta.value ?? null);

  const handleEditorChange = (value: string) => {
    setEditorContent(value);
    richText.change?.(value);
  };

  return (
    <div className={className}>
      <Label htmlFor={id} error={err} {...labelProps} />
      <Suspense
        fallback={
          <div className='min-h-[150px] rounded-md border border-gray-200 p-2 text-sm text-gray-400'>
            Loading editor...
          </div>
        }
      />

      <div className='min-h-[32px] pb-3'>
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
        {description ? <FormDescription id={descriptionId}>{description}</FormDescription> : null}
      </div>
    </div>
  );
}

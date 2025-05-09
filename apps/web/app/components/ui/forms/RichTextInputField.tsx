import { lazy, Suspense, useId, useState } from 'react';
import type { FieldMetadata } from '@conform-to/react';
import { useInputControl } from '@conform-to/react';

import type { LabelProps } from '../label';
import { Label } from '../label';
import type { ListOfErrors } from './forms';
import { ErrorList, FormDescription, hasErrors } from './forms';

import { Spinner } from '~/components/loaders';

// Lazy import the rich editor
const LazyRichTextInput = lazy(() => import('../../go-editor'));

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
  placeholder = '',
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
      <Suspense fallback={<Spinner />}>
        <LazyRichTextInput
          editorState={editorContent}
          setEditorState={handleEditorChange}
          loading={false}
          placeholder={placeholder}
        />
      </Suspense>

      <div className='min-h-[32px] pt-1 pb-3'>
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
        {description ? <FormDescription id={descriptionId}>{description}</FormDescription> : null}
      </div>
    </div>
  );
}

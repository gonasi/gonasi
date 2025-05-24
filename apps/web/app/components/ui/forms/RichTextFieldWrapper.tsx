import type { FieldMetadata } from '@conform-to/react';

import { RichTextInputField } from './RichTextInputField';

export function RichTextFieldWrapper({
  fieldMeta,
  label,
  placeholder,
  description,
  required = false,
}: {
  fieldMeta: FieldMetadata<string>;
  label: string;
  placeholder: string;
  description: string;
  required?: boolean;
}) {
  return (
    <RichTextInputField
      labelProps={{ children: label, required }}
      meta={fieldMeta}
      placeholder={placeholder}
      errors={fieldMeta.errors}
      description={description}
    />
  );
}

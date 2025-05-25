import { Form } from 'react-router';
import { getFormProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { Save } from 'lucide-react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { RichTextContentSchema, type RichTextContentSchemaType } from '@gonasi/schemas/plugins';

import { useIsPending } from '../../../../utils/misc';
import type { EditPluginComponentProps } from '../../PluginRenderers/EditPluginTypesRenderer';

import { Button } from '~/components/ui/button';
import { ErrorList } from '~/components/ui/forms';
import { RichTextInputField } from '~/components/ui/forms/RichTextInputField';

export function EditRichTextPlugin({ block }: EditPluginComponentProps) {
  const pending = useIsPending();

  const { richTextState } = block.content as RichTextContentSchemaType;

  const [form, fields] = useForm({
    id: `edit-${block.plugin_type}-form`,
    constraint: getZodConstraint(RichTextContentSchema),
    defaultValue: {
      richTextState,
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: RichTextContentSchema });
    },
  });

  return (
    <Form method='POST' {...getFormProps(form)}>
      <HoneypotInputs />
      <RichTextInputField
        labelProps={{ children: 'Rich Text', required: true }}
        meta={fields.richTextState}
        placeholder='Start typing...'
        errors={fields.richTextState.errors}
        description='You can format your content using rich text.'
      />
      <ErrorList errors={Object.values(form.allErrors).flat()} id={form.errorId} />
      <div className='mt-4 flex justify-end space-x-2'>
        <Button
          type='submit'
          rightIcon={<Save />}
          disabled={pending}
          isLoading={pending}
          name='intent'
          value={block.plugin_type}
        >
          Edit
        </Button>
      </div>
    </Form>
  );
}

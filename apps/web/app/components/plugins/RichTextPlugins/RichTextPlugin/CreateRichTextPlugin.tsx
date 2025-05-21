import { Form } from 'react-router';
import { getFormProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { Save } from 'lucide-react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';
import { RichTextContentSchema } from '@gonasi/schemas/plugins';

import { Button } from '~/components/ui/button';
import { ErrorList } from '~/components/ui/forms';
import { RichTextInputField } from '~/components/ui/forms/RichTextInputField';
import { useIsPending } from '~/utils/misc';

interface CreateRichTextPluginProps {
  pluginTypeId: PluginTypeId;
}

export function CreateRichTextPlugin({ pluginTypeId }: CreateRichTextPluginProps) {
  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: `${pluginTypeId}-form`,
    constraint: getZodConstraint(RichTextContentSchema),
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
        meta={fields.content}
        placeholder='Start typing...'
        errors={fields.content.errors}
        description='You can format your content using rich text.'
      />

      <ErrorList errors={Object.values(form.allErrors).flat()} id={form.errorId} />

      <div className='mt-4 flex justify-end space-x-2'>
        <Button
          type='submit'
          rightIcon={<Save />}
          disabled={isPending}
          isLoading={isPending}
          name='intent'
          value={pluginTypeId}
        >
          Save
        </Button>
      </div>
    </Form>
  );
}

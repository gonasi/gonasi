import { useFetcher } from 'react-router';
import { useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { Save } from 'lucide-react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';
import { RichTextSchema } from '@gonasi/schemas/plugins';

import { Button } from '~/components/ui/button';
import { ErrorList } from '~/components/ui/forms';
import { RichTextInputField } from '~/components/ui/forms/RichTextInputField';
import { useIsPending } from '~/utils/misc';

interface CreateRichTextPluginProps {
  pluginTypeId: PluginTypeId;
}

export function CreateRichTextPlugin({ pluginTypeId }: CreateRichTextPluginProps) {
  const fetcher = useFetcher();
  const pending = useIsPending();

  const [form, fields] = useForm({
    id: `${pluginTypeId}-form`,
    constraint: getZodConstraint(RichTextSchema),

    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: RichTextSchema });
    },

    onSubmit(event, { formData }) {
      event.preventDefault();

      if (form.errors?.length) return;

      fetcher.submit(formData, {
        method: 'post',
      });
    },
  });

  return (
    <form id={form.id} onSubmit={form.onSubmit} className='space-y-4' noValidate>
      <HoneypotInputs />
      <RichTextInputField
        labelProps={{ children: 'Rich Text', required: true }}
        meta={fields.richTextState}
        placeholder='Start typing...'
        errors={fields.richTextState.errors}
        description='You can format your content using rich text.'
      />

      <ErrorList errors={form.errors} id={form.errorId} />

      <div className='mt-4 flex justify-end space-x-2'>
        <Button
          type='submit'
          rightIcon={<Save />}
          disabled={pending}
          isLoading={pending}
          name='intent'
          value={pluginTypeId}
        >
          Save
        </Button>
      </div>
    </form>
  );
}

import { useEffect, useState } from 'react';
import { useFetcher } from 'react-router';
import { useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { Save } from 'lucide-react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';
import { RichTextContent } from '@gonasi/schemas/plugins';

import { Button } from '~/components/ui/button';
import { ErrorList } from '~/components/ui/forms';
import { RichTextInputField } from '~/components/ui/forms/RichTextInputField';

interface CreateRichTextPluginProps {
  name: PluginTypeId;
}

export function CreateRichTextPlugin({ name }: CreateRichTextPluginProps) {
  const fetcher = useFetcher();

  const [loading, setLoading] = useState(false);

  // Set up an effect to monitor fetcher state
  useEffect(() => {
    if (fetcher.state === 'submitting') {
      setLoading(true);
    } else if (fetcher.state === 'idle' && fetcher.data) {
      setLoading(false);
    }
  }, [fetcher.state, fetcher.data]);

  const [form, fields] = useForm({
    id: `${name}-form`,
    constraint: getZodConstraint(RichTextContent),
    defaultValue: { data: { richTextState: '' } },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: RichTextContent });
    },

    onSubmit(event, { formData }) {
      event.preventDefault();

      if (form.errors?.length) return;

      fetcher.submit(formData, {
        method: 'post',
      });
    },
  });

  const data = fields.data.getFieldset();

  return (
    <form id={form.id} onSubmit={form.onSubmit} className='space-y-4' noValidate>
      <HoneypotInputs />
      <RichTextInputField
        labelProps={{ children: 'Rich Text', required: true }}
        meta={data.richTextState}
        placeholder='Start typing...'
        errors={data.richTextState.errors}
        description='You can format your content using rich text.'
      />

      <ErrorList errors={form.errors} id={form.errorId} />

      <div className='mt-4 flex justify-end space-x-2'>
        <Button
          type='submit'
          rightIcon={<Save />}
          disabled={loading}
          isLoading={loading}
          name='intent'
          value={name}
        >
          Save
        </Button>
      </div>
    </form>
  );
}

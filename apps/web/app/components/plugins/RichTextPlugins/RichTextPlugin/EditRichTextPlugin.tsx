import { useEffect, useState } from 'react';
import { useFetcher } from 'react-router';
import { useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { Save } from 'lucide-react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { RichTextContent } from '@gonasi/schemas/plugins';

import { Button } from '~/components/ui/button';
import { ErrorList } from '~/components/ui/forms';
import { RichTextInputField } from '~/components/ui/forms/RichTextInputField';
import type { LessonBlockLoaderReturnType } from '~/routes/dashboard/courses/lessons/edit-plugin-modal';

interface EditRichTextPluginProps {
  block: LessonBlockLoaderReturnType;
}

export function EditRichTextPlugin({ block }: EditRichTextPluginProps) {
  const fetcher = useFetcher();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(
      fetcher.state === 'submitting' || (fetcher.state === 'idle' && fetcher.data !== undefined),
    );
  }, [fetcher.state, fetcher.data]);

  const [form, fields] = useForm({
    id: `edit-${block.plugin_type}-form`,
    constraint: getZodConstraint(RichTextContent),
    defaultValue: block.content,
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: RichTextContent });
    },
    onSubmit(event, { formData }) {
      event.preventDefault();
      if (form.errors?.length) return;
      fetcher.submit(formData, { method: 'post' });
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
          value={block.plugin_type}
        >
          Edit
        </Button>
      </div>
    </form>
  );
}

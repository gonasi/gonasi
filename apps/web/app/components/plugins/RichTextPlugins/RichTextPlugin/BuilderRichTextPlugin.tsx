import { useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type { PluginTypeId, RichTextSchemaTypes } from '@gonasi/schemas/plugins';
import { RichTextSchema } from '@gonasi/schemas/plugins';

import { Button } from '~/components/ui/button';
import { GoRichTextInputField } from '~/components/ui/forms/elements';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(RichTextSchema);

interface BuilderRichTextPluginProps {
  pluginTypeId: PluginTypeId;
}

export function BuilderRichTextPlugin({ pluginTypeId }: BuilderRichTextPluginProps) {
  const params = useParams();
  const isPending = useIsPending();

  const methods = useRemixForm<RichTextSchemaTypes>({
    mode: 'all',
    resolver,
    submitData: {
      pluginType: 'rich_text_editor',
    },
    defaultValues: {
      blockId: '',
      courseId: params.courseId,
      lessonId: params.lessonId,
      pluginType: 'rich_text_editor',
      settings: {
        playbackMode: 'inline',
        weight: 1,
      },
    },
  });

  console.log('errors: ', methods.getValues('content.richTextState'));

  return (
    <RemixFormProvider {...methods}>
      <form onSubmit={methods.handleSubmit} method='POST'>
        <HoneypotInputs />
        <GoRichTextInputField
          name='content.richTextState'
          labelProps={{ children: 'Rich Text', required: true }}
          description='You can format your content using rich text.'
          placeholder='Start typing...'
        />

        <div className='mt-4 flex justify-end space-x-2'>
          <Button
            type='submit'
            rightIcon={<Save />}
            disabled={isPending}
            isLoading={isPending || methods.formState.isSubmitting}
          >
            Save
          </Button>
        </div>
      </form>
    </RemixFormProvider>
  );
}

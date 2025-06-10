import { useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type { RichTextSchemaTypes } from '@gonasi/schemas/plugins';
import { RichTextSchema } from '@gonasi/schemas/plugins';

import { Button } from '~/components/ui/button';
import { GoRichTextInputField } from '~/components/ui/forms/elements';
import type { LessonBlockLoaderReturnType } from '~/routes/dashboard/courses/lessons/plugins/edit-plugin-modal';
import { getActionUrl } from '~/utils/get-action-url';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(RichTextSchema);

interface BuilderRichTextPluginProps {
  block?: LessonBlockLoaderReturnType;
}

export function BuilderRichTextPlugin({ block }: BuilderRichTextPluginProps) {
  const params = useParams();
  const isPending = useIsPending();

  const methods = useRemixForm<RichTextSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      courseId: params.courseId,
      lessonId: params.lessonId,
      pluginType: 'rich_text_editor',
      settings: {
        playbackMode: 'inline',
        weight: 1,
      },
    },
  });

  const actionUrl = getActionUrl(
    {
      username: params.username,
      courseId: params.courseId,
      chapterId: params.chapterId,
      lessonId: params.lessonId,
    },
    { id: block && block.id ? block.id : undefined },
  );

  console.log('action url: ', actionUrl);

  return (
    <RemixFormProvider {...methods}>
      <form onSubmit={methods.handleSubmit} method='POST' action={actionUrl}>
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

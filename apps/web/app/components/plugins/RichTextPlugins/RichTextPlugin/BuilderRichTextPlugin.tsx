import { useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Settings } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type { RichTextSchemaTypes } from '@gonasi/schemas/plugins';
import {
  EMPTY_LEXICAL_STATE,
  RichTextContentSchema,
  RichTextSchema,
  RichTextSettingsSchema,
} from '@gonasi/schemas/plugins';

import { BackArrowNavLink, Button } from '~/components/ui/button';
import { GoRichTextInputField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import type { LessonBlockLoaderReturnType } from '~/routes/profile/course-builder/courseId/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal';
import { getActionUrl } from '~/utils/get-action-url';
import { getLessonPath } from '~/utils/get-lesson-path';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(RichTextSchema);

interface BuilderRichTextPluginProps {
  block?: LessonBlockLoaderReturnType;
}

export function BuilderRichTextPlugin({ block }: BuilderRichTextPluginProps) {
  const params = useParams();
  const isPending = useIsPending();

  const { username, courseId, chapterId, lessonId, pluginGroupId } = params;

  const lessonPath = getLessonPath({ username, courseId, chapterId, lessonId });
  const backRoute = `${lessonPath}/plugins/${pluginGroupId}`;

  const methods = useRemixForm<RichTextSchemaTypes>({
    mode: 'onBlur',
    resolver,
    defaultValues: block
      ? {
          blockId: block.id,
          courseId: params.courseId!,
          lessonId: params.lessonId!,
          pluginType: 'rich_text_editor',
          content: RichTextContentSchema.safeParse(block.content).success
            ? RichTextContentSchema.parse(block.content)
            : { richTextState: EMPTY_LEXICAL_STATE },
          settings: RichTextSettingsSchema.safeParse(block.settings).success
            ? RichTextSettingsSchema.parse(block.settings)
            : { playbackMode: 'inline', weight: 1 },
        }
      : {
          courseId: params.courseId!,
          lessonId: params.lessonId!,
          pluginType: 'rich_text_editor',
          content: { richTextState: EMPTY_LEXICAL_STATE },
          settings: { playbackMode: 'inline', weight: 1 },
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

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal.Content size='md'>
      <Modal.Header
        leadingIcon={<BackArrowNavLink to={backRoute} />}
        title='Rich Text Editor'
        closeRoute={lessonPath}
        settingsPopover={
          <Popover>
            <PopoverTrigger asChild>
              <Settings
                className='transition-transform duration-200 hover:scale-105 hover:rotate-15 hover:cursor-pointer'
                size={20}
              />
            </PopoverTrigger>
            <PopoverContent className='max-w-sm'>
              <div className='grid gap-4'>
                <div className='space-y-2'>
                  <h4 className='leading-none font-medium'>Dimensions</h4>
                  <p className='text-muted-foreground text-sm'>Set the dimensions for the layer.</p>
                </div>
                <div className='grid gap-2'>hello</div>
              </div>
            </PopoverContent>
          </Popover>
        }
      />
      <Modal.Body>
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
                disabled={isDisabled || !methods.formState.isDirty}
                isLoading={isDisabled}
              >
                Save
              </Button>
            </div>
          </form>
        </RemixFormProvider>
      </Modal.Body>
    </Modal.Content>
  );
}

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

import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';

import { BackArrowNavLink, Button } from '~/components/ui/button';
import { GoLexicalInputField } from '~/components/ui/forms/elements/GoLexicalInputField';
import { Modal } from '~/components/ui/modal';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import type { LessonBlockLoaderReturnType } from '~/routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal';
import { getActionUrl } from '~/utils/get-action-url';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(RichTextSchema);

interface BuilderRichTextPluginProps {
  block?: LessonBlockLoaderReturnType;
}

export function BuilderRichTextPlugin({ block }: BuilderRichTextPluginProps) {
  const params = useParams();
  const isPending = useIsPending();

  const { organizationId, courseId, chapterId, lessonId, pluginGroupId } = params;

  const lessonPath = `/${organizationId}/builder/${courseId}/content/${chapterId}/${lessonId}/lesson-blocks`;
  const backRoute = `${lessonPath}/plugins/${pluginGroupId}`;

  const methods = useRemixForm<RichTextSchemaTypes>({
    mode: 'onBlur',
    resolver,
    defaultValues: block
      ? {
          id: block.id,
          organization_id: params.organizationId!,
          course_id: params.courseId!,
          chapter_id: params.chapterId!,
          lesson_id: params.lessonId!,
          plugin_type: 'rich_text_editor',
          content: RichTextContentSchema.safeParse(block.content).success
            ? RichTextContentSchema.parse(block.content)
            : { richTextState: EMPTY_LEXICAL_STATE },
          settings: RichTextSettingsSchema.safeParse(block.settings).success
            ? RichTextSettingsSchema.parse(block.settings)
            : { playbackMode: 'inline', weight: 1 },
        }
      : {
          organization_id: params.organizationId!,
          course_id: params.courseId!,
          chapter_id: params.chapterId!,
          lesson_id: params.lessonId!,
          plugin_type: 'rich_text_editor',
          content: { richTextState: EMPTY_LEXICAL_STATE },
          settings: { playbackMode: 'inline', weight: 1 },
        },
  });

  const actionUrl = getActionUrl(
    {
      organizationId: params.organizationId,
      courseId: params.courseId,
      chapterId: params.chapterId,
      lessonId: params.lessonId,
    },
    { id: block && block.id ? block.id : undefined },
  );

  const isDisabled = isPending || methods.formState.isSubmitting;

  const watchPlaybackMode = methods.watch('settings.playbackMode');

  return (
    <Modal.Content size='md'>
      <RemixFormProvider {...methods}>
        <form onSubmit={methods.handleSubmit} method='POST' action={actionUrl}>
          <HoneypotInputs />
          <Modal.Header
            leadingIcon={block && block.id ? null : <BackArrowNavLink to={backRoute} />}
            title={block && block.id ? 'Edit Rich Text' : 'Add Rich Text'}
            closeRoute={lessonPath}
            settingsPopover={
              <Popover>
                <PopoverTrigger asChild>
                  <Settings
                    className='transition-transform duration-200 hover:scale-105 hover:rotate-15 hover:cursor-pointer'
                    size={20}
                  />
                </PopoverTrigger>
                <PopoverContent className='w-full max-w-md'>
                  <div className='grid gap-4'>
                    <div className='space-y-2'>
                      <h4 className='leading-none font-medium'>Block Settings</h4>
                    </div>
                    <div className='grid gap-2'>
                      <BlockWeightField name='settings.weight' />
                      <PlaybackModeField
                        name='settings.playbackMode'
                        watchValue={watchPlaybackMode}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            }
          />
          <Modal.Body>
            <GoLexicalInputField
              name='content.richTextState'
              labelProps={{ children: 'Rich Text', required: true }}
              description='You can format your content using rich text.'
              placeholder='Start typing...'
            />

            <div className='mt-4 flex justify-between space-x-2'>
              <Button
                type='submit'
                rightIcon={<Save />}
                disabled={isDisabled || !methods.formState.isDirty}
                isLoading={isDisabled}
              >
                Save
              </Button>
            </div>
          </Modal.Body>
        </form>
      </RemixFormProvider>
    </Modal.Content>
  );
}

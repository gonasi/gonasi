import { useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Settings } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type {
  FillInTheBlankContentSchemaTypes,
  FillInTheBlankSchemaTypes,
  FillInTheBlankSettingsSchemaTypes,
} from '@gonasi/schemas/plugins';
import {
  EMPTY_LEXICAL_STATE,
  FillInTheBlankContentSchema,
  FillInTheBlankSchema,
  FillInTheBlankSettingsSchema,
} from '@gonasi/schemas/plugins';

import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';

import { BackArrowNavLink, Button } from '~/components/ui/button';
import {
  GoCheckBoxField,
  GoInputField,
  GoRichTextInputField,
  GoTextAreaField,
} from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import type { LessonBlockLoaderReturnType } from '~/routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal';
import { getActionUrl } from '~/utils/get-action-url';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(FillInTheBlankSchema);

interface BuilderFillInTheBlankPluginProps {
  block?: LessonBlockLoaderReturnType;
}

const defaultContent: FillInTheBlankContentSchemaTypes = {
  questionState: EMPTY_LEXICAL_STATE,
  correctAnswer: '',
  explanationState: EMPTY_LEXICAL_STATE,
  caseSensitive: false,
};

const defaultSettings: FillInTheBlankSettingsSchemaTypes = {
  playbackMode: 'inline',
  weight: 1,
};

export function BuilderFillInTheBlankPlugin({ block }: BuilderFillInTheBlankPluginProps) {
  const params = useParams();
  const isPending = useIsPending();

  const { organizationId, courseId, chapterId, lessonId, pluginGroupId } = params;

  const lessonPath = `/${organizationId}/builder/${courseId}/content/${chapterId}/${lessonId}/lesson-blocks`;
  const backRoute = `${lessonPath}/plugins/${pluginGroupId}`;

  const methods = useRemixForm<FillInTheBlankSchemaTypes>({
    mode: 'onBlur',
    resolver,
    defaultValues: block
      ? {
          id: block.id,
          organization_id: params.organizationId!,
          course_id: params.courseId!,
          chapter_id: params.chapterId!,
          lesson_id: params.lessonId!,
          plugin_type: 'fill_in_the_blank',
          content: FillInTheBlankContentSchema.safeParse(block.content).success
            ? FillInTheBlankContentSchema.parse(block.content)
            : defaultContent,
          settings: FillInTheBlankSettingsSchema.safeParse(block.settings).success
            ? FillInTheBlankSettingsSchema.parse(block.settings)
            : defaultSettings,
        }
      : {
          organization_id: params.organizationId!,
          course_id: params.courseId!,
          chapter_id: params.chapterId!,
          lesson_id: params.lessonId!,
          plugin_type: 'fill_in_the_blank',
          content: defaultContent,
          settings: defaultSettings,
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
    <Modal open>
      <Modal.Content size='md'>
        <RemixFormProvider {...methods}>
          <form onSubmit={methods.handleSubmit} method='POST' action={actionUrl}>
            <Modal.Header
              leadingIcon={block?.id ? null : <BackArrowNavLink to={backRoute} />}
              title={block?.id ? 'Edit Fill in the Blank' : 'Add Fill in the Blank'}
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
                        <h4 className='leading-none font-medium'>Block settings</h4>
                        <p className='text-muted-foreground text-sm'>
                          Tweak how this block behaves, your rules, your way!
                        </p>
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
              <HoneypotInputs />

              <GoRichTextInputField
                name='content.questionState'
                labelProps={{ children: 'Question', required: true }}
                placeholder='Type your question here...'
                description='What question should learners answer by filling in the blank?'
              />
              <GoInputField
                name='content.correctAnswer'
                labelProps={{ children: 'Correct Answer', required: true }}
                inputProps={{ disabled: isDisabled, placeholder: 'Enter the correct answer...' }}
                description='The exact answer learners need to provide (one or two words).'
              />
              <GoCheckBoxField
                name='content.caseSensitive'
                labelProps={{ children: 'Case Sensitive' }}
                disabled={isDisabled}
                description='Should the answer be case-sensitive? (e.g., "Paris" vs "paris")'
              />
              <GoRichTextInputField
                name='content.explanationState'
                labelProps={{ children: 'Why is that the answer?', required: true }}
                placeholder='Share your wisdom...'
                description='Help learners understand why this is the correct answer.'
              />
              <GoTextAreaField
                name='content.hint'
                labelProps={{ children: 'Need a hint?' }}
                textareaProps={{ disabled: isDisabled }}
                description={`Give learners a gentle nudge if they're stuck (optional).`}
              />
            </Modal.Body>
            <div className='bg-background/90 border-t-border/20 sticky right-0 bottom-0 left-0 z-10 flex justify-end space-x-2 border-t p-4'>
              <div className='flex w-full'>
                <Button
                  type='submit'
                  rightIcon={<Save />}
                  disabled={isDisabled || !methods.formState.isDirty}
                  isLoading={isDisabled}
                >
                  Save
                </Button>
              </div>
            </div>
          </form>
        </RemixFormProvider>
      </Modal.Content>
    </Modal>
  );
}

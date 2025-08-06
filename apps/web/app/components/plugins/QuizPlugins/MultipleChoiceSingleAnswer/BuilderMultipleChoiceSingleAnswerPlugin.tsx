import { useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Settings } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type {
  MultipleChoiceSingleAnswerContentSchemaTypes,
  MultipleChoiceSingleAnswerSchemaTypes,
  MultipleChoiceSingleAnswerSettingsSchemaTypes,
} from '@gonasi/schemas/plugins';
import {
  EMPTY_LEXICAL_STATE,
  MultipleChoiceSingleAnswerContentSchema,
  MultipleChoiceSingleAnswerSchema,
  MultipleChoiceSingleAnswerSettingsSchema,
} from '@gonasi/schemas/plugins';

// 👉 You'll need to build or reuse this for choice entry
import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { LayoutStyleField } from '../../common/settings/LayoutStyleField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';
import { RandomizationModeField } from '../../common/settings/RandomizationModeField';

import { BackArrowNavLink, Button } from '~/components/ui/button';
import {
  GoChoiceField,
  GoRichTextInputField,
  GoTextAreaField,
} from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import type { LessonBlockLoaderReturnType } from '~/routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal';
import { getActionUrl } from '~/utils/get-action-url';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(MultipleChoiceSingleAnswerSchema);

interface BuilderMultipleChoiceSingleAnswerPluginProps {
  block?: LessonBlockLoaderReturnType;
}

const defaultContent: MultipleChoiceSingleAnswerContentSchemaTypes = {
  questionState: EMPTY_LEXICAL_STATE,
  choices: [],
  explanationState: EMPTY_LEXICAL_STATE,
};

const defaultSettings: MultipleChoiceSingleAnswerSettingsSchemaTypes = {
  playbackMode: 'inline',
  weight: 1,
  layoutStyle: 'double',
  randomization: 'none',
};

export function BuilderMultipleChoiceSingleAnswerPlugin({
  block,
}: BuilderMultipleChoiceSingleAnswerPluginProps) {
  const params = useParams();
  const isPending = useIsPending();

  const { organizationId, courseId, chapterId, lessonId, pluginGroupId } = params;

  const lessonPath = `/${organizationId}/builder/${courseId}/content/${chapterId}/${lessonId}/lesson-blocks`;
  const backRoute = `${lessonPath}/plugins/${pluginGroupId}`;

  const methods = useRemixForm<MultipleChoiceSingleAnswerSchemaTypes>({
    mode: 'onBlur',
    resolver,
    defaultValues: block
      ? {
          id: block.id,
          organization_id: organizationId!,
          course_id: courseId!,
          chapter_id: chapterId!,
          lesson_id: lessonId!,
          plugin_type: 'multiple_choice_single',
          content: MultipleChoiceSingleAnswerContentSchema.safeParse(block.content).success
            ? MultipleChoiceSingleAnswerContentSchema.parse(block.content)
            : defaultContent,
          settings: MultipleChoiceSingleAnswerSettingsSchema.safeParse(block.settings).success
            ? MultipleChoiceSingleAnswerSettingsSchema.parse(block.settings)
            : defaultSettings,
        }
      : {
          organization_id: organizationId!,
          course_id: courseId!,
          chapter_id: chapterId!,
          lesson_id: lessonId!,
          plugin_type: 'multiple_choice_single',
          content: defaultContent,
          settings: defaultSettings,
        },
  });

  const actionUrl = getActionUrl(
    { organizationId, courseId, chapterId, lessonId },
    { id: block?.id },
  );

  const isDisabled = isPending || methods.formState.isSubmitting;

  const watchPlaybackMode = methods.watch('settings.playbackMode');
  const watchLayoutStyle = methods.watch('settings.layoutStyle');
  const watchRandomization = methods.watch('settings.randomization');

  return (
    <Modal open>
      <Modal.Content size='md'>
        <RemixFormProvider {...methods}>
          <form onSubmit={methods.handleSubmit} method='POST' action={actionUrl}>
            <Modal.Header
              leadingIcon={block?.id ? null : <BackArrowNavLink to={backRoute} />}
              title={block?.id ? 'Edit Multiple Choice' : 'Add Multiple Choice'}
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
                        <LayoutStyleField
                          name='settings.layoutStyle'
                          watchValue={watchLayoutStyle}
                        />
                        <RandomizationModeField
                          name='settings.randomization'
                          watchValue={watchRandomization}
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
                placeholder='Ask a challenging question...'
                description='Make learners think deeply about this one!'
              />

              <GoChoiceField
                name='content.choices'
                labelProps={{ children: 'Choices', required: true }}
              />

              <GoRichTextInputField
                name='content.explanationState'
                labelProps={{ children: 'Why is that the answer?', required: true }}
                placeholder='Give a short explanation...'
                description='Briefly explain the reasoning behind the correct answer. This helps learners build deeper understanding, especially if they got it wrong.'
              />

              <GoTextAreaField
                name='content.hint'
                labelProps={{ children: 'Hint (optional)' }}
                textareaProps={{ disabled: isDisabled }}
                description='Provide a subtle clue to help learners.'
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

import { useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Settings } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type {
  TrueOrFalseContentSchemaTypes,
  TrueOrFalseSchemaTypes,
  TrueOrFalseSettingsSchemaTypes,
} from '@gonasi/schemas/plugins';
import {
  EMPTY_LEXICAL_STATE,
  TrueOrFalseContentSchema,
  TrueOrFalseSchema,
  TrueOrFalseSettingsSchema,
} from '@gonasi/schemas/plugins';

import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { LayoutStyleField } from '../../common/settings/LayoutStyleField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';
import { RandomizationModeField } from '../../common/settings/RandomizationModeField';

import { BackArrowNavLink, Button } from '~/components/ui/button';
import {
  GoRadioGroupField,
  GoRichTextInputField,
  GoTextAreaField,
} from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import type { LessonBlockLoaderReturnType } from '~/routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal';
import { getActionUrl } from '~/utils/get-action-url';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(TrueOrFalseSchema);

interface BuilderTrueOrFalsePluginProps {
  block?: LessonBlockLoaderReturnType;
}

const defaultContent: TrueOrFalseContentSchemaTypes = {
  questionState: EMPTY_LEXICAL_STATE,
  correctAnswer: 'true',
  explanationState: EMPTY_LEXICAL_STATE,
};

const defaultSettings: TrueOrFalseSettingsSchemaTypes = {
  playbackMode: 'inline',
  weight: 1,
  layoutStyle: 'double',
  randomization: 'none',
};

export function BuilderTrueOrFalsePlugin({ block }: BuilderTrueOrFalsePluginProps) {
  const params = useParams();
  const isPending = useIsPending();

  const { organizationId, courseId, chapterId, lessonId, pluginGroupId } = params;

  const lessonPath = `/${organizationId}/builder/${courseId}/content/${chapterId}/${lessonId}/lesson-blocks`;
  const backRoute = `${lessonPath}/plugins/${pluginGroupId}`;

  const methods = useRemixForm<TrueOrFalseSchemaTypes>({
    mode: 'onBlur',
    resolver,
    defaultValues: block
      ? {
          id: block.id,
          organization_id: params.organizationId!,
          course_id: params.courseId!,
          chapter_id: params.chapterId!,
          lesson_id: params.lessonId!,
          plugin_type: 'true_or_false',
          content: TrueOrFalseContentSchema.safeParse(block.content).success
            ? TrueOrFalseContentSchema.parse(block.content)
            : defaultContent,
          settings: TrueOrFalseSettingsSchema.safeParse(block.settings).success
            ? TrueOrFalseSettingsSchema.parse(block.settings)
            : defaultSettings,
        }
      : {
          organization_id: params.organizationId!,
          course_id: params.courseId!,
          chapter_id: params.chapterId!,
          lesson_id: params.lessonId!,
          plugin_type: 'true_or_false',
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
  const watchLayoutStyle = methods.watch('settings.layoutStyle');
  const watchRandomization = methods.watch('settings.randomization');

  return (
    <Modal.Content size='md'>
      <RemixFormProvider {...methods}>
        <form onSubmit={methods.handleSubmit} method='POST' action={actionUrl}>
          <HoneypotInputs />
          <Modal.Header
            leadingIcon={block?.id ? null : <BackArrowNavLink to={backRoute} />}
            title={block?.id ? 'Edit True or False' : 'Add True or False'}
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
                      <LayoutStyleField name='settings.layoutStyle' watchValue={watchLayoutStyle} />
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
            <GoRichTextInputField
              name='content.questionState'
              labelProps={{ children: 'Question', required: true }}
              placeholder='Type your brain teaser here...'
              description='What statement should learners decide is true or false? Make it fun!'
            />
            <GoRadioGroupField
              name='content.correctAnswer'
              labelProps={{ children: 'What’s the right call?' }}
              options={[
                { value: 'true', label: 'True' },
                { value: 'false', label: 'False' },
              ]}
              description='Pick the correct answer — no pressure!'
            />
            <GoRichTextInputField
              name='content.explanationState'
              labelProps={{ children: 'Why is that the answer?', required: true }}
              placeholder='Share your wisdom...'
              description='Help learners get the “aha!” moment by explaining the logic.'
            />
            <GoTextAreaField
              name='content.hint'
              labelProps={{ children: 'Need a hint?' }}
              textareaProps={{ disabled: isDisabled }}
              description='Give learners a gentle nudge if they’re stuck (optional).'
            />
            <div className='mt-4 flex justify-between space-x-2'>
              <Button
                type='submit'
                rightIcon={<Save />}
                disabled={isDisabled || !methods.formState.isDirty}
                isLoading={isDisabled}
              >
                Save it!
              </Button>
            </div>
          </Modal.Body>
        </form>
      </RemixFormProvider>
    </Modal.Content>
  );
}

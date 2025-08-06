import { Suspense } from 'react';
import { useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Settings } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type {
  MultipleChoiceMultipleAnswersContentSchemaTypes,
  MultipleChoiceMultipleAnswersSchemaTypes,
  MultipleChoiceMultipleAnswersSettingsSchemaTypes,
} from '@gonasi/schemas/plugins';
import {
  EMPTY_LEXICAL_STATE,
  MultipleChoiceMultipleAnswersContentSchema,
  MultipleChoiceMultipleAnswersSchema,
  MultipleChoiceMultipleAnswersSettingsSchema,
} from '@gonasi/schemas/plugins';

import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { LayoutStyleField } from '../../common/settings/LayoutStyleField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';
import { RandomizationModeField } from '../../common/settings/RandomizationModeField';

import { Spinner } from '~/components/loaders';
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

const resolver = zodResolver(MultipleChoiceMultipleAnswersSchema);

interface BuilderMultipleChoiceMultipleAnswersPluginProps {
  block?: LessonBlockLoaderReturnType;
}

const defaultContent: MultipleChoiceMultipleAnswersContentSchemaTypes = {
  questionState: EMPTY_LEXICAL_STATE,
  choices: [],
  explanationState: EMPTY_LEXICAL_STATE,
};

const defaultSettings: MultipleChoiceMultipleAnswersSettingsSchemaTypes = {
  playbackMode: 'inline',
  weight: 1,
  layoutStyle: 'double',
  randomization: 'none',
};

function MultipleChoiceFormContent({
  block,
  lessonPath,
}: {
  block?: LessonBlockLoaderReturnType;
  lessonPath: string;
}) {
  const params = useParams();
  const isPending = useIsPending();
  const { organizationId, courseId, chapterId, lessonId } = params;

  const methods = useRemixForm<MultipleChoiceMultipleAnswersSchemaTypes>({
    mode: 'onBlur',
    resolver,
    defaultValues: block
      ? {
          id: block.id,
          organization_id: organizationId!,
          course_id: courseId!,
          chapter_id: chapterId!,
          lesson_id: lessonId!,
          plugin_type: 'multiple_choice_multiple',
          content: MultipleChoiceMultipleAnswersContentSchema.safeParse(block.content).success
            ? MultipleChoiceMultipleAnswersContentSchema.parse(block.content)
            : defaultContent,
          settings: MultipleChoiceMultipleAnswersSettingsSchema.safeParse(block.settings).success
            ? MultipleChoiceMultipleAnswersSettingsSchema.parse(block.settings)
            : defaultSettings,
        }
      : {
          organization_id: organizationId!,
          course_id: courseId!,
          chapter_id: chapterId!,
          lesson_id: lessonId!,
          plugin_type: 'multiple_choice_multiple',
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
    <RemixFormProvider {...methods}>
      <form onSubmit={methods.handleSubmit} method='POST' action={actionUrl}>
        <Modal.Header
          leadingIcon={
            block?.id ? null : (
              <BackArrowNavLink to={`${lessonPath}/plugins/${params.pluginGroupId}`} />
            )
          }
          title={block?.id ? 'Edit Multiple Answers' : 'Add Multiple Answers'}
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
          <HoneypotInputs />

          <GoRichTextInputField
            name='content.questionState'
            labelProps={{ children: 'Question', required: true }}
            placeholder='Pose a challenging question...'
            description='Learners may need to select more than one correct answer.'
          />

          <GoChoiceField
            name='content.choices'
            labelProps={{ children: 'Choices (select all that apply)', required: true }}
            minChoices={3}
            maxChoices={10}
          />

          <GoRichTextInputField
            name='content.explanationState'
            labelProps={{ children: 'Explanation', required: true }}
            placeholder='Provide your reasoning...'
            description='Explain why the correct answers are correct and others are not.'
          />

          <GoTextAreaField
            name='content.hint'
            labelProps={{ children: 'Hint (optional)' }}
            textareaProps={{ disabled: isDisabled }}
            description='Offer a clue to guide learners without giving away the answer.'
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
  );
}

export function BuilderMultipleChoiceMultipleAnswersPlugin({
  block,
}: BuilderMultipleChoiceMultipleAnswersPluginProps) {
  const params = useParams();
  const { organizationId, courseId, chapterId, lessonId } = params;
  const lessonPath = `/${organizationId}/builder/${courseId}/content/${chapterId}/${lessonId}/lesson-blocks`;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Suspense fallback={<Spinner />}>
          <MultipleChoiceFormContent block={block} lessonPath={lessonPath} />
        </Suspense>
      </Modal.Content>
    </Modal>
  );
}

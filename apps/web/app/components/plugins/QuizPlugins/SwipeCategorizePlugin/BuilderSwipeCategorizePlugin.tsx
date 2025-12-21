import { useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Settings } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type {
  SwipeCategorizeContentSchemaTypes,
  SwipeCategorizeSchemaTypes,
  SwipeCategorizeSettingsSchemaTypes,
} from '@gonasi/schemas/plugins';
import {
  EMPTY_LEXICAL_STATE,
  SwipeCategorizeContentSchema,
  SwipeCategorizeSchema,
  SwipeCategorizeSettingsSchema,
} from '@gonasi/schemas/plugins';

import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';
import { RandomizationModeField } from '../../common/settings/RandomizationModeField';

import { BackArrowNavLink, Button } from '~/components/ui/button';
import {
  GoCardField,
  GoInputField,
  GoRichTextInputField,
  GoTextAreaField,
} from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import type { LessonBlockLoaderReturnType } from '~/routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal';
import { getActionUrl } from '~/utils/get-action-url';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(SwipeCategorizeSchema);

interface BuilderSwipeCategorizePluginProps {
  block?: LessonBlockLoaderReturnType;
}

const defaultContent: SwipeCategorizeContentSchemaTypes = {
  questionState: EMPTY_LEXICAL_STATE,
  leftLabel: 'Left',
  rightLabel: 'Right',
  cards: [],
};

const defaultSettings: SwipeCategorizeSettingsSchemaTypes = {
  playbackMode: 'inline',
  weight: 1,
  randomization: 'shuffle',
};

export function BuilderSwipeCategorizePlugin({ block }: BuilderSwipeCategorizePluginProps) {
  console.log('[BuilderSwipeCategorizePlugin] Rendering with block:', block);

  const params = useParams();
  const isPending = useIsPending();

  const { organizationId, courseId, chapterId, lessonId, pluginGroupId } = params;
  console.log('[BuilderSwipeCategorizePlugin] params:', {
    organizationId,
    courseId,
    chapterId,
    lessonId,
    pluginGroupId,
  });

  const lessonPath = `/${organizationId}/builder/${courseId}/content/${chapterId}/${lessonId}/lesson-blocks`;
  const backRoute = `${lessonPath}/plugins/${pluginGroupId}`;

  const methods = useRemixForm<SwipeCategorizeSchemaTypes>({
    mode: 'onBlur',
    resolver,
    defaultValues: block
      ? {
          id: block.id,
          organization_id: params.organizationId!,
          course_id: params.courseId!,
          chapter_id: params.chapterId!,
          lesson_id: params.lessonId!,
          plugin_type: 'swipe_categorize',
          content: SwipeCategorizeContentSchema.safeParse(block.content).success
            ? SwipeCategorizeContentSchema.parse(block.content)
            : defaultContent,
          settings: SwipeCategorizeSettingsSchema.safeParse(block.settings).success
            ? SwipeCategorizeSettingsSchema.parse(block.settings)
            : defaultSettings,
        }
      : {
          organization_id: params.organizationId!,
          course_id: params.courseId!,
          chapter_id: params.chapterId!,
          lesson_id: params.lessonId!,
          plugin_type: 'swipe_categorize',
          content: defaultContent,
          settings: defaultSettings,
        },
  });

  const watchPlaybackMode = methods.watch('settings.playbackMode');
  const watchRandomization = methods.watch('settings.randomization');

  const actionUrl = getActionUrl(
    {
      organizationId: params.organizationId,
      courseId: params.courseId,
      chapterId: params.chapterId,
      lessonId: params.lessonId,
    },
    { id: block && block.id ? block.id : undefined },
  );

  return (
    <Modal open>
      <Modal.Content size='lg'>
        <RemixFormProvider {...methods}>
          <form onSubmit={methods.handleSubmit} method='POST' action={actionUrl}>
            <Modal.Header
              leadingIcon={block?.id ? null : <BackArrowNavLink to={backRoute} />}
              title={block?.id ? 'Edit Swipe Categorize' : 'Add Swipe Categorize'}
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
                placeholder='Enter your swipe categorize question or instructions...'
                description='What should learners categorize? Make it clear and engaging!'
              />

              <div className='grid grid-cols-2 gap-4'>
                <GoInputField
                  name='content.leftLabel'
                  labelProps={{ children: 'Left Category Label', required: true }}
                  inputProps={{
                    placeholder: 'e.g., True, Correct, Fact',
                    maxLength: 20,
                    disabled: isPending,
                  }}
                  description='Label for the left category (max 20 characters)'
                />

                <GoInputField
                  name='content.rightLabel'
                  labelProps={{ children: 'Right Category Label', required: true }}
                  inputProps={{
                    placeholder: 'e.g., False, Incorrect, Opinion',
                    maxLength: 20,
                    disabled: isPending,
                  }}
                  description='Label for the right category (max 20 characters)'
                />
              </div>

              <GoCardField
                name='content.cards'
                labelProps={{ children: 'Cards', required: true }}
                description='Add 3-20 cards. Each card will be swiped left or right into the correct category.'
                minCards={3}
                maxCards={20}
              />

              <GoTextAreaField
                name='content.hint'
                labelProps={{ children: 'Hint' }}
                textareaProps={{ disabled: isPending }}
                description='Optional hint that learners can reveal if they need help (10-100 characters).'
              />
            </Modal.Body>
            <div className='bg-background/90 border-t-border/20 sticky right-0 bottom-0 left-0 z-10 flex justify-end space-x-2 border-t p-4'>
              <div className='flex w-full'>
                <Button
                  type='submit'
                  rightIcon={<Save />}
                  disabled={isPending || !methods.formState.isDirty}
                  isLoading={isPending}
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

import { useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Settings } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type { StepByStepRevealSchemaTypes } from '@gonasi/schemas/plugins';
import {
  EMPTY_LEXICAL_STATE,
  StepByStepRevealContentSchema,
  StepByStepRevealSchema,
  StepByStepRevealSettingsSchema,
} from '@gonasi/schemas/plugins';

import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';

import { BackArrowNavLink, Button } from '~/components/ui/button';
import { GoRichTextInputField } from '~/components/ui/forms/elements';
import { GoStepByStepRevealField } from '~/components/ui/forms/elements/GoStepByStepRevealField';
// import { GoStepByStepRevealInputField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import type { LessonBlockLoaderReturnType } from '~/routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal';
import { getActionUrl } from '~/utils/get-action-url';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(StepByStepRevealSchema);

interface BuilderStepByStepRevealPluginProps {
  block?: LessonBlockLoaderReturnType;
}

export function BuilderStepByStepRevealPlugin({ block }: BuilderStepByStepRevealPluginProps) {
  const params = useParams();
  const isPending = useIsPending();

  const { organizationId, courseId, chapterId, lessonId, pluginGroupId } = params;

  const lessonPath = `/${organizationId}/builder/${courseId}/content/${chapterId}/${lessonId}/lesson-blocks`;
  const backRoute = `${lessonPath}/plugins/${pluginGroupId}`;

  const methods = useRemixForm<StepByStepRevealSchemaTypes>({
    mode: 'onBlur',
    resolver,
    defaultValues: block
      ? {
          id: block.id,
          organization_id: params.organizationId!,
          course_id: params.courseId!,
          chapter_id: params.chapterId!,
          lesson_id: params.lessonId!,
          plugin_type: 'step_by_step_reveal',
          content: StepByStepRevealContentSchema.safeParse(block.content).success
            ? StepByStepRevealContentSchema.parse(block.content)
            : { id: crypto.randomUUID(), title: EMPTY_LEXICAL_STATE, cards: [] },
          settings: StepByStepRevealSettingsSchema.safeParse(block.settings).success
            ? StepByStepRevealSettingsSchema.parse(block.settings)
            : { playbackMode: 'inline', weight: 1 },
        }
      : {
          organization_id: params.organizationId!,
          course_id: params.courseId!,
          chapter_id: params.chapterId!,
          lesson_id: params.lessonId!,
          plugin_type: 'step_by_step_reveal',
          content: { id: crypto.randomUUID(), title: EMPTY_LEXICAL_STATE, cards: [] },
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
    <Modal open>
      <Modal.Content size='md'>
        <RemixFormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit}
            method='POST'
            action={actionUrl}
            className='flex h-full flex-col'
          >
            <Modal.Header
              leadingIcon={block && block.id ? null : <BackArrowNavLink to={backRoute} />}
              title={block && block.id ? 'Edit Step By Step Reveal' : 'Add Step By Step Reveal'}
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
            <Modal.Body className='flex-1 overflow-auto'>
              <HoneypotInputs />
              <GoRichTextInputField
                name='content.title'
                labelProps={{ children: 'Title', required: false }}
                placeholder='Title displayed above the card(s)'
                description='Add a title that will appear above the step-by-step reveal card(s).'
              />

              <GoStepByStepRevealField
                name='content.cards'
                labelProps={{ children: 'Reveal Cards', required: true }}
                description='Add a title and cards for your step-by-step reveal.'
              />
              <h2>hello there component goes here</h2>
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

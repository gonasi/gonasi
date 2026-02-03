import { useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Settings } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type {
  StepByStepRevealSchemaTypes,
  StepByStepRevealSettingsSchemaTypes,
} from '@gonasi/schemas/plugins';
import {
  EMPTY_LEXICAL_STATE,
  StepByStepRevealContentSchema,
  StepByStepRevealSchema,
  StepByStepRevealSettingsSchema,
} from '@gonasi/schemas/plugins';

import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { CarouselLayoutField } from '../../common/settings/CarouselLayoutField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';
import { RandomizationModeField } from '../../common/settings/RandomizationModeField';

import { BackArrowNavLink, Button } from '~/components/ui/button';
import { GoRichTextInputField } from '~/components/ui/forms/elements';
import { GoStepByStepRevealField } from '~/components/ui/forms/elements/GoStepByStepRevealField';
// import { GoStepByStepRevealInputField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import type { LessonBlockLoaderReturnType } from '~/routes/organizations/courses/course/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal';
import { getActionUrl } from '~/utils/get-action-url';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(StepByStepRevealSchema);

interface BuilderStepByStepRevealPluginProps {
  block?: LessonBlockLoaderReturnType;
}

const defaultSettings: StepByStepRevealSettingsSchemaTypes = {
  playbackMode: 'inline',
  weight: 1,
  layoutStyle: 'double',
  randomization: 'none',
};

// Migration helper: Convert old card format to new format
function migrateCardToNewFormat(card: any): any {
  // If card already has frontContentData and backContentData, return as is
  if ('frontContentData' in card && 'backContentData' in card) {
    return card;
  }

  // Migrate old format
  const migratedCard: any = { ...card };

  // Migrate frontContent -> frontContentData
  if ('frontContent' in card && !('frontContentData' in card)) {
    migratedCard.frontContentData = {
      type: 'richtext',
      content: card.frontContent,
    };
    delete migratedCard.frontContent;
  }

  // Migrate backContent -> backContentData
  if ('backContent' in card && !('backContentData' in card)) {
    migratedCard.backContentData = {
      type: 'richtext',
      content: card.backContent,
    };
    delete migratedCard.backContent;
  }

  return migratedCard;
}

export function BuilderStepByStepRevealPlugin({ block }: BuilderStepByStepRevealPluginProps) {
  const params = useParams();
  const isPending = useIsPending();

  const { organizationId, courseId, chapterId, lessonId, pluginGroupId } = params;

  const lessonPath = `/${organizationId}/courses/${courseId}/content/${chapterId}/${lessonId}/lesson-blocks`;
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
            ? {
                ...StepByStepRevealContentSchema.parse(block.content),
                // Migrate cards to new format
                cards: (block.content as any).cards?.map(migrateCardToNewFormat) || [],
              }
            : { id: crypto.randomUUID(), title: EMPTY_LEXICAL_STATE, cards: [] },
          settings: StepByStepRevealSettingsSchema.safeParse(block.settings).success
            ? StepByStepRevealSettingsSchema.parse(block.settings)
            : defaultSettings,
        }
      : {
          organization_id: params.organizationId!,
          course_id: params.courseId!,
          chapter_id: params.chapterId!,
          lesson_id: params.lessonId!,
          plugin_type: 'step_by_step_reveal',
          content: { id: crypto.randomUUID(), title: EMPTY_LEXICAL_STATE, cards: [] },
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
    <Modal open>
      <Modal.Content size='md'>
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
                    <CarouselLayoutField
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
          <RemixFormProvider {...methods}>
            <form
              id='step-by-step-reveal-form'
              onSubmit={methods.handleSubmit}
              method='POST'
              action={actionUrl}
            >
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
            </form>
          </RemixFormProvider>
        </Modal.Body>
        <Modal.Footer>
          <div className='flex w-full justify-end'>
            <Button
              type='submit'
              form='step-by-step-reveal-form'
              rightIcon={<Save />}
              disabled={isDisabled || !methods.formState.isDirty}
              isLoading={isDisabled}
            >
              Save
            </Button>
          </div>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}

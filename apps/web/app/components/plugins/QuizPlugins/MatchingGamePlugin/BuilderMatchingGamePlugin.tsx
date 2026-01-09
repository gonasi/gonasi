import { useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Settings } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type {
  MatchingGameContentSchemaTypes,
  MatchingGameSchemaTypes,
  MatchingGameSettingsSchemaTypes,
} from '@gonasi/schemas/plugins';
import {
  EMPTY_LEXICAL_STATE,
  MatchingGameContentSchema,
  MatchingGameSchema,
  MatchingGameSettingsSchema,
} from '@gonasi/schemas/plugins';

import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { LayoutStyleField } from '../../common/settings/LayoutStyleField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';
import { RandomizationModeField } from '../../common/settings/RandomizationModeField';

import { BackArrowNavLink, Button } from '~/components/ui/button';
import {
  GoMatchingPairField,
  GoRichTextInputField,
  GoTextAreaField,
} from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import type { LessonBlockLoaderReturnType } from '~/routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal';
import { getActionUrl } from '~/utils/get-action-url';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(MatchingGameSchema);

interface BuilderMatchingGamePluginProps {
  block?: LessonBlockLoaderReturnType;
}

const defaultContent: MatchingGameContentSchemaTypes = {
  questionState: EMPTY_LEXICAL_STATE,
  pairs: [],
};

const defaultSettings: MatchingGameSettingsSchemaTypes = {
  playbackMode: 'inline',
  weight: 1,
  layoutStyle: 'double',
  randomization: 'shuffle',
};

// Migration helper: Convert old pair format to new format
function migratePairToNewFormat(pair: any): any {
  // If pair already has contentData, return as is
  if ('leftContentData' in pair && 'rightContentData' in pair) {
    console.log('[Migration] Pair already has contentData:', pair);
    return pair;
  }

  // Migrate old format: { leftContent: LexicalState, rightContent: LexicalState } -> { leftContentData: { type: 'richtext', content: LexicalState }, rightContentData: { type: 'richtext', content: LexicalState } }
  if ('leftContent' in pair && 'rightContent' in pair) {
    console.log('[Migration] Migrating old format pair:', pair.id);
    return {
      ...pair,
      leftContentData: {
        type: 'richtext',
        content: pair.leftContent,
      },
      rightContentData: {
        type: 'richtext',
        content: pair.rightContent,
      },
      // Remove old fields
      leftContent: undefined,
      rightContent: undefined,
    };
  }

  // Shouldn't happen, but return as-is if neither field exists
  console.warn('[Migration] Pair has neither old nor new format:', pair);
  return pair;
}

export function BuilderMatchingGamePlugin({ block }: BuilderMatchingGamePluginProps) {
  console.log('[BuilderMatchingGamePlugin] Rendering with block:', block);

  const params = useParams();
  const isPending = useIsPending();

  const { organizationId, courseId, chapterId, lessonId, pluginGroupId } = params;
  console.log('[BuilderMatchingGamePlugin] params:', {
    organizationId,
    courseId,
    chapterId,
    lessonId,
    pluginGroupId,
  });

  const lessonPath = `/${organizationId}/builder/${courseId}/content/${chapterId}/${lessonId}/lesson-blocks`;
  const backRoute = `${lessonPath}/plugins/${pluginGroupId}`;

  const methods = useRemixForm<MatchingGameSchemaTypes>({
    mode: 'onBlur',
    resolver,
    defaultValues: block
      ? {
          id: block.id,
          organization_id: params.organizationId!,
          course_id: params.courseId!,
          chapter_id: params.chapterId!,
          lesson_id: params.lessonId!,
          plugin_type: 'matching_game',
          content: MatchingGameContentSchema.safeParse(block.content).success
            ? {
                ...MatchingGameContentSchema.parse(block.content),
                // Migrate pairs to new format
                pairs: (block.content as any).pairs?.map(migratePairToNewFormat) || [],
              }
            : defaultContent,
          settings: MatchingGameSettingsSchema.safeParse(block.settings).success
            ? MatchingGameSettingsSchema.parse(block.settings)
            : defaultSettings,
        }
      : {
          organization_id: params.organizationId!,
          course_id: params.courseId!,
          chapter_id: params.chapterId!,
          lesson_id: params.lessonId!,
          plugin_type: 'matching_game',
          content: defaultContent,
          settings: defaultSettings,
        },
  });

  const watchPlaybackMode = methods.watch('settings.playbackMode');
  const watchLayoutStyle = methods.watch('settings.layoutStyle');
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
              title={block?.id ? 'Edit Matching Game' : 'Add Matching Game'}
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
                placeholder='Enter your matching game question or instructions...'
                description='What should learners match? Make it clear and engaging!'
              />
              <GoMatchingPairField
                name='content.pairs'
                labelProps={{ children: 'Matching Pairs', required: true }}
                description='Add 2-10 matching pairs. Each pair consists of a left item and a right item that learners will match.'
                minPairs={2}
                maxPairs={10}
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

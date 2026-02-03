import { lazy, Suspense } from 'react';
import { Controller } from 'react-hook-form';
import { useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, File, Play, Plus, Save, Settings } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { FileType } from '@gonasi/schemas/file';
import type {
  AudioPlayerSchemaTypes,
  AudioPlayerSettingsSchemaTypes,
} from '@gonasi/schemas/plugins';
import {
  AudioPlayerContentSchema,
  AudioPlayerSchema,
  AudioPlayerSettingsSchema,
} from '@gonasi/schemas/plugins';

import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';

import useModal from '~/components/go-editor/hooks/useModal';
import { Spinner } from '~/components/loaders';
import { BackArrowNavLink, Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Label } from '~/components/ui/label';
import { Modal } from '~/components/ui/modal';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { IconTooltipButton } from '~/components/ui/tooltip';
import type { SearchFileResult } from '~/routes/api/search-files';
import type { LessonBlockLoaderReturnType } from '~/routes/organizations/courses/course/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal';
import { getActionUrl } from '~/utils/get-action-url';
import { useIsPending } from '~/utils/misc';

const InsertMediaDialog = lazy(() => import('../../MediaInteraction/common/InsertMediaDialog'));
const LazyAudioPreview = lazy(() =>
  import('./components/AudioPreview').then((module) => ({
    default: module.AudioPreview,
  })),
);

const resolver = zodResolver(AudioPlayerSchema);

interface BuilderAudioPlayerPluginProps {
  block?: LessonBlockLoaderReturnType;
}

const defaultContent: AudioPlayerSchemaTypes['content'] = {
  audio_id: '',
};

const defaultSettings: AudioPlayerSettingsSchemaTypes = {
  playbackMode: 'inline',
  weight: 3,
  autoplay: false,
  loop: false,
  allowSeek: true,
  playbackSpeed: true,
  showTimestamp: true,
};

export function BuilderAudioPlayerPlugin({ block }: BuilderAudioPlayerPluginProps) {
  const params = useParams();
  const isPending = useIsPending();
  const [modal, showModal] = useModal();

  const { organizationId, courseId, chapterId, lessonId, pluginGroupId } = params;

  const lessonPath = `/${organizationId}/courses/${courseId}/content/${chapterId}/${lessonId}/lesson-blocks`;
  const backRoute = `${lessonPath}/plugins/${pluginGroupId}`;

  const methods = useRemixForm<AudioPlayerSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: block
      ? {
          id: block.id,
          organization_id: organizationId!,
          course_id: courseId!,
          chapter_id: chapterId!,
          lesson_id: lessonId!,
          plugin_type: 'audio_player',
          content: AudioPlayerContentSchema.safeParse(block.content).success
            ? AudioPlayerContentSchema.parse(block.content)
            : defaultContent,
          settings: AudioPlayerSettingsSchema.safeParse(block.settings).success
            ? AudioPlayerSettingsSchema.parse(block.settings)
            : defaultSettings,
        }
      : {
          organization_id: organizationId!,
          course_id: courseId!,
          chapter_id: chapterId!,
          lesson_id: lessonId!,
          plugin_type: 'audio_player',
          content: defaultContent,
          settings: defaultSettings,
        },
  });

  const actionUrl = getActionUrl(
    {
      organizationId,
      courseId,
      chapterId,
      lessonId,
    },
    { id: block?.id },
  );

  const isDisabled = isPending || methods.formState.isSubmitting;
  const watchPlaybackMode = methods.watch('settings.playbackMode');
  const watchAudioSelection = methods.watch('content.audio_id');
  const getAudioId = methods.getValues('content.audio_id');

  return (
    <Modal open>
      <Modal.Content size='full'>
        <RemixFormProvider {...methods}>
          <form onSubmit={methods.handleSubmit} method='POST' action={actionUrl}>
            <Modal.Header
              leadingIcon={block?.id ? null : <BackArrowNavLink to={backRoute} />}
              title={block?.id ? 'Edit Audio Player' : 'Add Audio Player'}
              closeRoute={lessonPath}
              settingsPopover={
                <Popover modal>
                  <PopoverTrigger asChild>
                    <Settings
                      className='transition-transform duration-200 hover:scale-105 hover:rotate-15 hover:cursor-pointer'
                      size={20}
                    />
                  </PopoverTrigger>
                  <PopoverContent className='w-full max-w-md p-0'>
                    <div className='max-h-[600px] overflow-y-auto p-4'>
                      <div className='grid gap-4'>
                        <div className='space-y-2'>
                          <h4 className='leading-none font-medium'>Block settings</h4>
                          <p className='text-muted-foreground text-sm'>
                            Configure audio player behavior and controls
                          </p>
                        </div>
                        <div className='grid gap-4'>
                          <BlockWeightField name='settings.weight' />
                          <PlaybackModeField
                            name='settings.playbackMode'
                            watchValue={watchPlaybackMode}
                          />

                          {/* Audio-specific settings */}
                          <div className='space-y-3'>
                            <p className='text-muted-foreground text-sm font-medium'>
                              Playback Controls
                            </p>

                            <Controller
                              name='settings.autoplay'
                              control={methods.control}
                              render={({ field }) => (
                                <div className='flex items-center space-x-2'>
                                  <Checkbox
                                    id='autoplay'
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <Label htmlFor='autoplay' className='text-sm'>
                                    Autoplay audio
                                  </Label>
                                </div>
                              )}
                            />

                            <Controller
                              name='settings.loop'
                              control={methods.control}
                              render={({ field }) => (
                                <div className='flex items-center space-x-2'>
                                  <Checkbox
                                    id='loop'
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <Label htmlFor='loop' className='text-sm'>
                                    Loop audio
                                  </Label>
                                </div>
                              )}
                            />

                            <Controller
                              name='settings.allowSeek'
                              control={methods.control}
                              render={({ field }) => (
                                <div className='flex items-center space-x-2'>
                                  <Checkbox
                                    id='allowSeek'
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <Label htmlFor='allowSeek' className='text-sm'>
                                    Allow seeking forward
                                  </Label>
                                </div>
                              )}
                            />

                            <Controller
                              name='settings.playbackSpeed'
                              control={methods.control}
                              render={({ field }) => (
                                <div className='flex items-center space-x-2'>
                                  <Checkbox
                                    id='playbackSpeed'
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <Label htmlFor='playbackSpeed' className='text-sm'>
                                    Show playback speed controls
                                  </Label>
                                </div>
                              )}
                            />

                            <Controller
                              name='settings.showTimestamp'
                              control={methods.control}
                              render={({ field }) => (
                                <div className='flex items-center space-x-2'>
                                  <Checkbox
                                    id='showTimestamp'
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <Label htmlFor='showTimestamp' className='text-sm'>
                                    Show timestamp
                                  </Label>
                                </div>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              }
            />
            <Modal.Body>
              <HoneypotInputs />
              <div className='relative'>
                {/* Top-right icon button */}
                <div className='absolute top-2 right-2 z-5'>
                  <IconTooltipButton
                    type='button'
                    variant='secondary'
                    title={watchAudioSelection ? 'Edit audio' : 'Add audio'}
                    icon={watchAudioSelection ? Edit : Plus}
                    onClick={() => {
                      showModal(
                        'Select Audio',
                        (onClose) => (
                          <Suspense fallback={<Spinner />}>
                            <InsertMediaDialog
                              fileTypes={[FileType.AUDIO]}
                              handleImageInsert={(file: SearchFileResult) => {
                                methods.setValue('content.audio_id', file.id, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                                onClose();
                              }}
                            />
                          </Suspense>
                        ),
                        '',
                        <File />,
                        'lg',
                      );
                    }}
                  />
                </div>

                {/* Audio preview or placeholder */}
                <div className='border-border/20 min-h-20 w-full border'>
                  {watchAudioSelection ? (
                    <Suspense fallback={<Spinner />}>
                      <LazyAudioPreview audioId={getAudioId} />
                    </Suspense>
                  ) : (
                    <div className='max-w-ms mx-auto flex min-h-100 items-center justify-center md:max-w-lg'>
                      <div className='text-muted-foreground flex flex-col items-center'>
                        <Play size={40} />
                        <p className='font-secondary py-2 text-xs'>No audio selected</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {modal}
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

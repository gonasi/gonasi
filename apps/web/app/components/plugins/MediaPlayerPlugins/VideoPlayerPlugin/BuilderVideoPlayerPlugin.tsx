import { lazy, Suspense } from 'react';
import { useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, File, Play, Plus, Save, Settings } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { FileType } from '@gonasi/schemas/file';
import type {
  VideoPlayerSettingsSchemaTypes,
  VideoPlayerSchemaTypes,
} from '@gonasi/schemas/plugins';
import {
  VideoPlayerContentSchema,
  VideoPlayerSchema,
  VideoPlayerSettingsSchema,
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
import type { LessonBlockLoaderReturnType } from '~/routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal';
import { getActionUrl } from '~/utils/get-action-url';
import { useIsPending } from '~/utils/misc';

const InsertMediaDialog = lazy(
  () => import('../../MediaInteraction/common/InsertMediaDialog'),
);
const LazyVideoPreview = lazy(() =>
  import('./components/VideoPreview').then((module) => ({
    default: module.VideoPreview,
  })),
);

const resolver = zodResolver(VideoPlayerSchema);

interface BuilderVideoPlayerPluginProps {
  block?: LessonBlockLoaderReturnType;
}

const defaultContent: VideoPlayerSchemaTypes['content'] = {
  video_id: '',
};

const defaultSettings: VideoPlayerSettingsSchemaTypes = {
  playbackMode: 'inline',
  weight: 3,
  autoplay: false,
  controls: true,
  loop: false,
  muted: false,
  allowSeek: true,
  playbackSpeed: true,
};

export function BuilderVideoPlayerPlugin({ block }: BuilderVideoPlayerPluginProps) {
  const params = useParams();
  const isPending = useIsPending();
  const [modal, showModal] = useModal();

  const { organizationId, courseId, chapterId, lessonId, pluginGroupId } = params;

  const lessonPath = `/${organizationId}/builder/${courseId}/content/${chapterId}/${lessonId}/lesson-blocks`;
  const backRoute = `${lessonPath}/plugins/${pluginGroupId}`;

  const methods = useRemixForm<VideoPlayerSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: block
      ? {
          id: block.id,
          organization_id: organizationId!,
          course_id: courseId!,
          chapter_id: chapterId!,
          lesson_id: lessonId!,
          plugin_type: 'video_player',
          content: VideoPlayerContentSchema.safeParse(block.content).success
            ? VideoPlayerContentSchema.parse(block.content)
            : defaultContent,
          settings: VideoPlayerSettingsSchema.safeParse(block.settings).success
            ? VideoPlayerSettingsSchema.parse(block.settings)
            : defaultSettings,
        }
      : {
          organization_id: organizationId!,
          course_id: courseId!,
          chapter_id: chapterId!,
          lesson_id: lessonId!,
          plugin_type: 'video_player',
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
  const watchVideoSelection = methods.watch('content.video_id');
  const getVideoId = methods.getValues('content.video_id');

  // Watch settings for checkbox controls
  const watchAutoplay = methods.watch('settings.autoplay');
  const watchControls = methods.watch('settings.controls');
  const watchLoop = methods.watch('settings.loop');
  const watchMuted = methods.watch('settings.muted');
  const watchAllowSeek = methods.watch('settings.allowSeek');
  const watchPlaybackSpeed = methods.watch('settings.playbackSpeed');

  return (
    <Modal open>
      <Modal.Content size='full'>
        <RemixFormProvider {...methods}>
          <form onSubmit={methods.handleSubmit} method='POST' action={actionUrl}>
            <Modal.Header
              leadingIcon={block?.id ? null : <BackArrowNavLink to={backRoute} />}
              title={block?.id ? 'Edit Video Player' : 'Add Video Player'}
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
                      <div className='grid gap-4'>
                        <BlockWeightField name='settings.weight' />
                        <PlaybackModeField
                          name='settings.playbackMode'
                          watchValue={watchPlaybackMode}
                        />

                        {/* Video-specific settings */}
                        <div className='space-y-3'>
                          <p className='text-muted-foreground text-sm font-medium'>
                            Playback Controls
                          </p>

                          <div className='flex items-center space-x-2'>
                            <Checkbox
                              id='autoplay'
                              checked={watchAutoplay}
                              onCheckedChange={(checked) =>
                                methods.setValue('settings.autoplay', checked === true)
                              }
                            />
                            <Label htmlFor='autoplay' className='text-sm'>
                              Autoplay video
                            </Label>
                          </div>

                          <div className='flex items-center space-x-2'>
                            <Checkbox
                              id='controls'
                              checked={watchControls}
                              onCheckedChange={(checked) =>
                                methods.setValue('settings.controls', checked === true)
                              }
                            />
                            <Label htmlFor='controls' className='text-sm'>
                              Show video controls
                            </Label>
                          </div>

                          <div className='flex items-center space-x-2'>
                            <Checkbox
                              id='loop'
                              checked={watchLoop}
                              onCheckedChange={(checked) =>
                                methods.setValue('settings.loop', checked === true)
                              }
                            />
                            <Label htmlFor='loop' className='text-sm'>
                              Loop video
                            </Label>
                          </div>

                          <div className='flex items-center space-x-2'>
                            <Checkbox
                              id='muted'
                              checked={watchMuted}
                              onCheckedChange={(checked) =>
                                methods.setValue('settings.muted', checked === true)
                              }
                            />
                            <Label htmlFor='muted' className='text-sm'>
                              Start muted
                            </Label>
                          </div>

                          <div className='flex items-center space-x-2'>
                            <Checkbox
                              id='allowSeek'
                              checked={watchAllowSeek}
                              onCheckedChange={(checked) =>
                                methods.setValue('settings.allowSeek', checked === true)
                              }
                            />
                            <Label htmlFor='allowSeek' className='text-sm'>
                              Allow seeking forward
                            </Label>
                          </div>

                          <div className='flex items-center space-x-2'>
                            <Checkbox
                              id='playbackSpeed'
                              checked={watchPlaybackSpeed}
                              onCheckedChange={(checked) =>
                                methods.setValue('settings.playbackSpeed', checked === true)
                              }
                            />
                            <Label htmlFor='playbackSpeed' className='text-sm'>
                              Show playback speed controls
                            </Label>
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
                    variant='secondary'
                    title={watchVideoSelection ? 'Edit video' : 'Add video'}
                    icon={watchVideoSelection ? Edit : Plus}
                    onClick={() => {
                      showModal(
                        'Select Video',
                        (onClose) => (
                          <Suspense fallback={<Spinner />}>
                            <InsertMediaDialog
                              fileType={FileType.VIDEO}
                              handleImageInsert={(file: SearchFileResult) => {
                                methods.setValue('content.video_id', file.id);
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

                {/* Video preview or placeholder */}
                <div className='border-border/20 min-h-20 w-full border'>
                  {watchVideoSelection ? (
                    <Suspense fallback={<Spinner />}>
                      <LazyVideoPreview videoId={getVideoId} />
                    </Suspense>
                  ) : (
                    <div className='max-w-ms mx-auto flex min-h-100 items-center justify-center md:max-w-lg'>
                      <div className='text-muted-foreground flex flex-col items-center'>
                        <Play size={40} />
                        <p className='font-secondary py-2 text-xs'>No video selected</p>
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

import { Controller } from 'react-hook-form';
import { useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Globe, Save, Settings } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type {
  YoutubeEmbedSchemaTypes,
  YoutubeEmbedSettingsSchemaTypes,
} from '@gonasi/schemas/plugins';
import {
  YoutubeEmbedContentSchema,
  YoutubeEmbedSchema,
  YoutubeEmbedSettingsSchema,
} from '@gonasi/schemas/plugins';

import { extractYouTubeId, getYouTubeThumbnail } from './utils/extractYouTubeId';
import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';

import { BackArrowNavLink, Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Modal } from '~/components/ui/modal';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import type { LessonBlockLoaderReturnType } from '~/routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal';
import { getActionUrl } from '~/utils/get-action-url';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(YoutubeEmbedSchema);

interface BuilderYouTubeEmbedPluginProps {
  block?: LessonBlockLoaderReturnType;
}

const defaultContent: YoutubeEmbedSchemaTypes['content'] = {
  youtube_url: '',
};

const defaultSettings: YoutubeEmbedSettingsSchemaTypes = {
  playbackMode: 'inline',
  weight: 3,
  autoplay: false,
  controls: true,
  loop: false,
  muted: false,
  captions: false,
  startTime: 0,
  allowSeek: true,
  privacyEnhanced: true,
};

export function BuilderYouTubeEmbedPlugin({ block }: BuilderYouTubeEmbedPluginProps) {
  const params = useParams();
  const isPending = useIsPending();

  const { organizationId, courseId, chapterId, lessonId, pluginGroupId } = params;

  const lessonPath = `/${organizationId}/builder/${courseId}/content/${chapterId}/${lessonId}/lesson-blocks`;
  const backRoute = `${lessonPath}/plugins/${pluginGroupId}`;

  const methods = useRemixForm<YoutubeEmbedSchemaTypes>({
    mode: 'all',
    // @ts-expect-error - Zod schemas with .default() create a type mismatch between input (optional) and output (required) types
    resolver,
    defaultValues: block
      ? {
          id: block.id,
          organization_id: organizationId!,
          course_id: courseId!,
          chapter_id: chapterId!,
          lesson_id: lessonId!,
          plugin_type: 'youtube_embed',
          content: YoutubeEmbedContentSchema.safeParse(block.content).success
            ? YoutubeEmbedContentSchema.parse(block.content)
            : defaultContent,
          settings: YoutubeEmbedSettingsSchema.safeParse(block.settings).success
            ? YoutubeEmbedSettingsSchema.parse(block.settings)
            : defaultSettings,
        }
      : {
          organization_id: organizationId!,
          course_id: courseId!,
          chapter_id: chapterId!,
          lesson_id: lessonId!,
          plugin_type: 'youtube_embed',
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
  const watchYoutubeUrl = methods.watch('content.youtube_url');
  const watchStartTime = methods.watch('settings.startTime');
  const watchEndTime = methods.watch('settings.endTime');

  // Extract video ID for preview
  const videoId = extractYouTubeId(watchYoutubeUrl || '');
  const thumbnailUrl = videoId ? getYouTubeThumbnail(videoId, 'hq') : null;

  return (
    <Modal open>
      <Modal.Content size='full'>
        <RemixFormProvider {...methods}>
          <form onSubmit={methods.handleSubmit} method='POST' action={actionUrl}>
            <Modal.Header
              leadingIcon={block?.id ? null : <BackArrowNavLink to={backRoute} />}
              title={block?.id ? 'Edit YouTube Embed' : 'Add YouTube Embed'}
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
                            Configure YouTube embed playback and privacy options
                          </p>
                        </div>
                        <div className='grid gap-4'>
                          <BlockWeightField name='settings.weight' />
                          <PlaybackModeField
                            name='settings.playbackMode'
                            watchValue={watchPlaybackMode}
                          />

                          {/* YouTube-specific settings */}
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
                                    Autoplay video
                                  </Label>
                                </div>
                              )}
                            />

                            <Controller
                              name='settings.controls'
                              control={methods.control}
                              render={({ field }) => (
                                <div className='flex items-center space-x-2'>
                                  <Checkbox
                                    id='controls'
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <Label htmlFor='controls' className='text-sm'>
                                    Show video controls
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
                                    Loop video
                                  </Label>
                                </div>
                              )}
                            />

                            <Controller
                              name='settings.muted'
                              control={methods.control}
                              render={({ field }) => (
                                <div className='flex items-center space-x-2'>
                                  <Checkbox
                                    id='muted'
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <Label htmlFor='muted' className='text-sm'>
                                    Start muted
                                  </Label>
                                </div>
                              )}
                            />

                            <Controller
                              name='settings.captions'
                              control={methods.control}
                              render={({ field }) => (
                                <div className='flex items-center space-x-2'>
                                  <Checkbox
                                    id='captions'
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <Label htmlFor='captions' className='text-sm'>
                                    Enable closed captions
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
                              name='settings.privacyEnhanced'
                              control={methods.control}
                              render={({ field }) => (
                                <div className='flex items-center space-x-2'>
                                  <Checkbox
                                    id='privacyEnhanced'
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <Label htmlFor='privacyEnhanced' className='text-sm'>
                                    Privacy-enhanced mode (no cookies)
                                  </Label>
                                </div>
                              )}
                            />
                          </div>

                          {/* Time controls */}
                          <div className='space-y-3'>
                            <p className='text-muted-foreground text-sm font-medium'>
                              Time Controls
                            </p>

                            <div className='space-y-2'>
                              <Label htmlFor='startTime' className='text-sm'>
                                Start time (seconds)
                              </Label>
                              <Input
                                id='startTime'
                                type='number'
                                min='0'
                                value={watchStartTime}
                                onChange={(e) =>
                                  methods.setValue(
                                    'settings.startTime',
                                    parseInt(e.target.value, 10) || 0,
                                  )
                                }
                              />
                            </div>

                            <div className='space-y-2'>
                              <Label htmlFor='endTime' className='text-sm'>
                                End time (seconds, optional)
                              </Label>
                              <Input
                                id='endTime'
                                type='number'
                                min='0'
                                value={watchEndTime || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  methods.setValue(
                                    'settings.endTime',
                                    val ? parseInt(val, 10) : undefined,
                                  );
                                }}
                              />
                            </div>
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
              <div className='space-y-4'>
                {/* URL Input */}
                <div className='space-y-2'>
                  <Label htmlFor='youtube_url' className='text-sm font-medium'>
                    YouTube URL or Video ID
                  </Label>
                  <Input
                    id='youtube_url'
                    placeholder='https://www.youtube.com/watch?v=... or video ID'
                    leftIcon={<Globe size={16} />}
                    {...methods.register('content.youtube_url')}
                  />
                  {methods.formState.errors.content?.youtube_url && (
                    <p className='text-destructive text-sm'>
                      {methods.formState.errors.content.youtube_url.message}
                    </p>
                  )}
                </div>

                {/* Preview */}
                <div className='border-border/20 min-h-20 w-full border'>
                  {videoId ? (
                    <div className='relative w-full' style={{ aspectRatio: '16/9' }}>
                      <img
                        src={thumbnailUrl!}
                        alt='YouTube video thumbnail'
                        className='h-full w-full object-cover'
                      />
                      <div className='bg-background/80 absolute bottom-2 left-2 rounded px-2 py-1 text-xs'>
                        Video ID: {videoId}
                      </div>
                    </div>
                  ) : (
                    <div className='max-w-ms mx-auto flex min-h-100 items-center justify-center md:max-w-lg'>
                      <div className='text-muted-foreground flex flex-col items-center'>
                        <Globe size={40} />
                        <p className='font-secondary py-2 text-xs'>
                          Enter a YouTube URL to see preview
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Modal.Body>
            <div className='bg-background/90 border-t-border/20 sticky right-0 bottom-0 left-0 z-10 flex justify-end space-x-2 border-t p-4'>
              <div className='flex w-full'>
                <Button
                  type='submit'
                  rightIcon={<Save />}
                  disabled={isDisabled || !methods.formState.isDirty || !videoId}
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

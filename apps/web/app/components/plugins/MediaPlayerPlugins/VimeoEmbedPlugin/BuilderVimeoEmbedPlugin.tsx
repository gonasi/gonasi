import { Controller } from 'react-hook-form';
import { useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Globe, Save, Settings } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type { VimeoEmbedSchemaTypes, VimeoEmbedSettingsSchemaTypes } from '@gonasi/schemas/plugins';
import {
  VimeoEmbedContentSchema,
  VimeoEmbedSchema,
  VimeoEmbedSettingsSchema,
} from '@gonasi/schemas/plugins';

import { extractVimeoId } from './utils/extractVimeoId';
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

const resolver = zodResolver(VimeoEmbedSchema);

interface BuilderVimeoEmbedPluginProps {
  block?: LessonBlockLoaderReturnType;
}

const defaultContent: VimeoEmbedSchemaTypes['content'] = {
  vimeo_url: '',
};

const defaultSettings: VimeoEmbedSettingsSchemaTypes = {
  playbackMode: 'inline',
  weight: 3,
  autoplay: false,
  controls: true,
  loop: false,
  muted: false,
  title: true,
  byline: true,
  portrait: true,
  color: '00adef',
  startTime: 0,
  allowSeek: true,
  dnt: true,
};

export function BuilderVimeoEmbedPlugin({ block }: BuilderVimeoEmbedPluginProps) {
  const params = useParams();
  const isPending = useIsPending();

  const { organizationId, courseId, chapterId, lessonId, pluginGroupId } = params;

  const lessonPath = `/${organizationId}/builder/${courseId}/content/${chapterId}/${lessonId}/lesson-blocks`;
  const backRoute = `${lessonPath}/plugins/${pluginGroupId}`;

  const methods = useRemixForm<VimeoEmbedSchemaTypes>({
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
          plugin_type: 'vimeo_embed',
          content: VimeoEmbedContentSchema.safeParse(block.content).success
            ? VimeoEmbedContentSchema.parse(block.content)
            : defaultContent,
          settings: VimeoEmbedSettingsSchema.safeParse(block.settings).success
            ? VimeoEmbedSettingsSchema.parse(block.settings)
            : defaultSettings,
        }
      : {
          organization_id: organizationId!,
          course_id: courseId!,
          chapter_id: chapterId!,
          lesson_id: lessonId!,
          plugin_type: 'vimeo_embed',
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
  const watchVimeoUrl = methods.watch('content.vimeo_url');
  const watchStartTime = methods.watch('settings.startTime');
  const watchColor = methods.watch('settings.color');

  // Extract video ID for preview
  const videoId = extractVimeoId(watchVimeoUrl || '');

  return (
    <Modal open>
      <Modal.Content size='full'>
        <RemixFormProvider {...methods}>
          <form onSubmit={methods.handleSubmit} method='POST' action={actionUrl}>
            <Modal.Header
              leadingIcon={block?.id ? null : <BackArrowNavLink to={backRoute} />}
              title={block?.id ? 'Edit Vimeo Embed' : 'Add Vimeo Embed'}
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
                            Configure Vimeo embed playback and display options
                          </p>
                        </div>
                        <div className='grid gap-4'>
                          <BlockWeightField name='settings.weight' />
                          <PlaybackModeField
                            name='settings.playbackMode'
                            watchValue={watchPlaybackMode}
                          />

                          {/* Vimeo-specific settings */}
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
                          </div>

                          {/* Display options */}
                          <div className='space-y-3'>
                            <p className='text-muted-foreground text-sm font-medium'>
                              Display Options
                            </p>

                            <Controller
                              name='settings.title'
                              control={methods.control}
                              render={({ field }) => (
                                <div className='flex items-center space-x-2'>
                                  <Checkbox
                                    id='title'
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <Label htmlFor='title' className='text-sm'>
                                    Show video title
                                  </Label>
                                </div>
                              )}
                            />

                            <Controller
                              name='settings.byline'
                              control={methods.control}
                              render={({ field }) => (
                                <div className='flex items-center space-x-2'>
                                  <Checkbox
                                    id='byline'
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <Label htmlFor='byline' className='text-sm'>
                                    Show author byline
                                  </Label>
                                </div>
                              )}
                            />

                            <Controller
                              name='settings.portrait'
                              control={methods.control}
                              render={({ field }) => (
                                <div className='flex items-center space-x-2'>
                                  <Checkbox
                                    id='portrait'
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <Label htmlFor='portrait' className='text-sm'>
                                    Show author portrait
                                  </Label>
                                </div>
                              )}
                            />

                            <div className='space-y-2'>
                              <Label htmlFor='color' className='text-sm'>
                                Player color (hex without #)
                              </Label>
                              <Input
                                id='color'
                                type='text'
                                placeholder='00adef'
                                value={watchColor}
                                onChange={(e) => methods.setValue('settings.color', e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Privacy */}
                          <div className='space-y-3'>
                            <p className='text-muted-foreground text-sm font-medium'>Privacy</p>

                            <Controller
                              name='settings.dnt'
                              control={methods.control}
                              render={({ field }) => (
                                <div className='flex items-center space-x-2'>
                                  <Checkbox
                                    id='dnt'
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <Label htmlFor='dnt' className='text-sm'>
                                    Do Not Track (prevent session tracking)
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
                  <Label htmlFor='vimeo_url' className='text-sm font-medium'>
                    Vimeo URL or Video ID
                  </Label>
                  <Input
                    id='vimeo_url'
                    placeholder='https://vimeo.com/... or video ID'
                    leftIcon={<Globe size={16} />}
                    {...methods.register('content.vimeo_url')}
                  />
                  {methods.formState.errors.content?.vimeo_url && (
                    <p className='text-destructive text-sm'>
                      {methods.formState.errors.content.vimeo_url.message}
                    </p>
                  )}
                </div>

                {/* Preview */}
                <div className='border-border/20 min-h-20 w-full border'>
                  {videoId ? (
                    <div className='relative w-full' style={{ aspectRatio: '16/9' }}>
                      <iframe
                        src={`https://player.vimeo.com/video/${videoId}`}
                        className='h-full w-full'
                        frameBorder='0'
                        allow='autoplay; fullscreen; picture-in-picture'
                        title='Vimeo video preview'
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
                          Enter a Vimeo URL to see preview
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

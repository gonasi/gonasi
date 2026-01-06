import { lazy, Suspense } from 'react';
import { useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, File, ImageOff, Plus, Save, Settings } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type {
  ImageFocusQuizSchemaTypes,
  ImageFocusQuizSettingsSchemaTypes,
} from '@gonasi/schemas/plugins';
import {
  ImageFocusQuizContentSchema,
  ImageFocusQuizSchema,
  ImageFocusQuizSettingsSchema,
} from '@gonasi/schemas/plugins';

import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';

import { BannerCard } from '~/components/cards';
import useModal from '~/components/go-editor/hooks/useModal';
import { Spinner } from '~/components/loaders';
import { BackArrowNavLink, Button } from '~/components/ui/button';
import { GoInputField, GoSelectInputField } from '~/components/ui/forms/elements';
import { Label } from '~/components/ui/label';
import { Modal } from '~/components/ui/modal';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { IconTooltipButton } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';
import type { SearchFileResult } from '~/routes/api/search-files';
import type { LessonBlockLoaderReturnType } from '~/routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal';
import { getActionUrl } from '~/utils/get-action-url';
import { useIsPending } from '~/utils/misc';

const InsertMediaDialog = lazy(() => import('../../MediaInteraction/common/InsertMediaDialog'));
const LazyImageFocusCanvas = lazy(() => import('./components/ImageFocusCanvas'));

const resolver = zodResolver(ImageFocusQuizSchema);

interface BuilderImageFocusQuizPluginProps {
  block?: LessonBlockLoaderReturnType;
}

const defaultContent: ImageFocusQuizSchemaTypes['content'] = {
  imageId: '',
  imageWidth: 800,
  imageHeight: 600,
  regions: [],
  initialDisplayDuration: 1,
};

const defaultSettings: ImageFocusQuizSettingsSchemaTypes = {
  playbackMode: 'standalone',
  weight: 5,
  revealMode: 'auto',
  defaultRevealDelay: 2,
  blurIntensity: 8,
  dimIntensity: 0.6,
  showFullImageBetweenRegions: false,
  betweenRegionsDuration: 0.8,
  autoAdvance: true,
  autoAdvanceDelay: 3,
  randomization: 'none',
  animationDuration: 600,
};

export function BuilderImageFocusQuizPlugin({ block }: BuilderImageFocusQuizPluginProps) {
  const params = useParams();
  const isPending = useIsPending();
  const [modal, showModal] = useModal();

  const { organizationId, courseId, chapterId, lessonId, pluginGroupId } = params;

  const lessonPath = `/${organizationId}/builder/${courseId}/content/${chapterId}/${lessonId}/lesson-blocks`;
  const backRoute = `${lessonPath}/plugins/${pluginGroupId}`;

  const methods = useRemixForm<ImageFocusQuizSchemaTypes>({
    mode: 'all',
    resolver: resolver as any,
    defaultValues: block
      ? {
          id: block.id,
          organization_id: organizationId!,
          course_id: courseId!,
          chapter_id: chapterId!,
          lesson_id: lessonId!,
          plugin_type: 'image_focus_quiz',
          content: ImageFocusQuizContentSchema.safeParse(block.content).success
            ? ImageFocusQuizContentSchema.parse(block.content)
            : defaultContent,
          settings: ImageFocusQuizSettingsSchema.safeParse(block.settings).success
            ? ImageFocusQuizSettingsSchema.parse(block.settings)
            : defaultSettings,
        }
      : {
          organization_id: organizationId!,
          course_id: courseId!,
          chapter_id: chapterId!,
          lesson_id: lessonId!,
          plugin_type: 'image_focus_quiz',
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
  const watchRevealMode = methods.watch('settings.revealMode');
  const watchImageSelection = methods.watch('content.imageId');
  const watchRegions = methods.watch('content.regions');

  return (
    <Modal open>
      <Modal.Content size='full'>
        <RemixFormProvider {...methods}>
          <form onSubmit={methods.handleSubmit} method='POST' action={actionUrl}>
            <Modal.Header
              leadingIcon={block?.id ? null : <BackArrowNavLink to={backRoute} />}
              title={block?.id ? 'Edit Image Focus Quiz' : 'Add Image Focus Quiz'}
              closeRoute={lessonPath}
              settingsPopover={
                <Popover>
                  <PopoverTrigger asChild>
                    <Settings
                      className='transition-transform duration-200 hover:scale-105 hover:rotate-15 hover:cursor-pointer'
                      size={20}
                    />
                  </PopoverTrigger>
                  <PopoverContent className='max-h-[70vh] w-full max-w-md overflow-y-auto'>
                    <div className='grid gap-4'>
                      <div className='space-y-2'>
                        <h4 className='leading-none font-medium'>Block settings</h4>
                        <p className='text-muted-foreground text-sm'>
                          Configure timing, visual effects, and flow control
                        </p>
                      </div>
                      <div className='grid gap-3'>
                        {/* Base Settings */}
                        <BlockWeightField name='settings.weight' />
                        <PlaybackModeField
                          name='settings.playbackMode'
                          watchValue={watchPlaybackMode}
                        />

                        {/* Reveal Settings */}
                        <div className='space-y-2'>
                          <Label className='text-sm font-medium'>Reveal Settings</Label>
                          <GoSelectInputField
                            name='settings.revealMode'
                            labelProps={{ children: 'Reveal Mode' }}
                            selectProps={{
                              placeholder: 'Select reveal mode',
                              options: [
                                { value: 'auto', label: 'Auto (timed reveal)' },
                                { value: 'manual', label: 'Manual (tap to reveal)' },
                              ],
                            }}
                          />
                          {watchRevealMode === 'auto' && (
                            <GoInputField
                              name='settings.defaultRevealDelay'
                              labelProps={{ children: 'Default Reveal Delay (seconds)' }}
                            />
                          )}
                        </div>

                        {/* Visual Effects */}
                        <div className='space-y-2'>
                          <Label className='text-sm font-medium'>Visual Effects</Label>
                          <GoInputField
                            name='settings.blurIntensity'
                            labelProps={{ children: 'Blur Intensity (0-20px)' }}
                          />
                          <GoInputField
                            name='settings.dimIntensity'
                            labelProps={{ children: 'Dim Intensity (0-1)' }}
                          />
                          <GoInputField
                            name='settings.animationDuration'
                            labelProps={{ children: 'Animation Duration (ms)' }}
                          />
                        </div>

                        {/* Flow Control */}
                        <div className='space-y-2'>
                          <Label className='text-sm font-medium'>Flow Control</Label>
                          <GoSelectInputField
                            name='settings.randomization'
                            labelProps={{ children: 'Region Order' }}
                            selectProps={{
                              options: [
                                { value: 'none', label: 'Sequential' },
                                { value: 'shuffle', label: 'Shuffled' },
                              ],
                            }}
                          />
                          <GoInputField
                            name='content.initialDisplayDuration'
                            labelProps={{ children: 'Initial Display Duration (s)' }}
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              }
            />
            <Modal.Body>
              <HoneypotInputs />
              <BannerCard
                showCloseIcon={false}
                variant='error'
                message='No regions added'
                description='Add regions to the image to create a quiz.'
                className='my-2'
              />
              <div className='relative'>
                {/* Top-right icon button */}
                <div
                  className={cn(
                    'absolute right-2 z-10',
                    watchImageSelection ? 'top-12' : 'top-2',
                    watchRegions?.length > 0 && 'hidden',
                  )}
                >
                  <IconTooltipButton
                    variant='secondary'
                    title={watchImageSelection ? 'Edit image' : 'Add image'}
                    icon={watchImageSelection ? Edit : Plus}
                    onClick={() => {
                      showModal(
                        'Insert Image',
                        (onClose) => (
                          <Suspense fallback={<Spinner />}>
                            <InsertMediaDialog
                              handleImageInsert={(file: SearchFileResult) => {
                                methods.setValue('content.imageId', file.id);
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

                {/* Canvas for region drawing */}
                <div className='border-border/20 min-h-20 w-full border'>
                  {watchImageSelection ? (
                    <Suspense fallback={<Spinner />}>
                      <LazyImageFocusCanvas
                        imageId={methods.getValues('content.imageId')}
                        name='content.regions'
                      />
                    </Suspense>
                  ) : (
                    <div className='max-w-ms mx-auto flex min-h-100 items-center justify-center md:max-w-lg'>
                      <div className='text-muted-foreground flex flex-col items-center'>
                        <ImageOff size={40} />
                        <p className='font-secondary py-2 text-xs'>No image selected</p>
                        <p className='text-xs'>Click + to add an image</p>
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

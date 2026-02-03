import { lazy, Suspense } from 'react';
import { useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, File, ImageOff, Plus, Save, Settings } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import type {
  GuidedImageHotspotSchemaSettingsTypes,
  GuidedImageHotspotSchemaTypes,
} from '@gonasi/schemas/plugins';
import {
  GuidedImageHotspotContentSchema,
  GuidedImageHotspotSchema,
  GuidedImageHotspotSchemaSettings,
} from '@gonasi/schemas/plugins';

import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';

import useModal from '~/components/go-editor/hooks/useModal';
import { Spinner } from '~/components/loaders';
import { BackArrowNavLink, Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { IconTooltipButton } from '~/components/ui/tooltip';
import type { SearchFileResult } from '~/routes/api/search-files';
import type { LessonBlockLoaderReturnType } from '~/routes/organizations/courses/course/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal';
import { getActionUrl } from '~/utils/get-action-url';
import { useIsPending } from '~/utils/misc';

const InsertMediaDialog = lazy(() => import('../common/InsertMediaDialog'));
const LazyMediaInteractionImage = lazy(() => import('./components/MediaInteractionImage'));

const resolver = zodResolver(GuidedImageHotspotSchema);

interface BuilderGuidedImageHotspotsPluginProps {
  block?: LessonBlockLoaderReturnType;
}

const defaultContent: GuidedImageHotspotSchemaTypes['content'] = {
  image_id: '',
  image_height: 600,
  image_width: 800,
  hotspots: [],
};

const defaultSettings: GuidedImageHotspotSchemaSettingsTypes = {
  playbackMode: 'standalone',
  weight: 5,
};

export function BuilderGuidedImageHotspotsPlugin({ block }: BuilderGuidedImageHotspotsPluginProps) {
  const params = useParams();
  const isPending = useIsPending();
  const [modal, showModal] = useModal();

  const { organizationId, courseId, chapterId, lessonId, pluginGroupId } = params;

  const lessonPath = `/${organizationId}/courses/${courseId}/content/${chapterId}/${lessonId}/lesson-blocks`;
  const backRoute = `${lessonPath}/plugins/${pluginGroupId}`;

  const methods = useRemixForm<GuidedImageHotspotSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: block
      ? {
          id: block.id,
          organization_id: organizationId!,
          course_id: courseId!,
          chapter_id: chapterId!,
          lesson_id: lessonId!,
          plugin_type: 'guided_image_hotspots',
          content: GuidedImageHotspotContentSchema.safeParse(block.content).success
            ? GuidedImageHotspotContentSchema.parse(block.content)
            : defaultContent,
          settings: GuidedImageHotspotSchemaSettings.safeParse(block.settings).success
            ? GuidedImageHotspotSchemaSettings.parse(block.settings)
            : defaultSettings,
        }
      : {
          organization_id: organizationId!,
          course_id: courseId!,
          chapter_id: chapterId!,
          lesson_id: lessonId!,
          plugin_type: 'guided_image_hotspots',
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
  const watchImageSelection = methods.watch('content.image_id');
  const getImageId = methods.getValues('content.image_id');
  const getHotspots = methods.getValues('content.hotspots');

  console.log('getHotspots: ', getHotspots);
  console.log('errors: ', methods.formState.errors);

  return (
    <Modal open>
      <Modal.Content size='full'>
        <RemixFormProvider {...methods}>
          <form onSubmit={methods.handleSubmit} method='POST' action={actionUrl}>
            <Modal.Header
              leadingIcon={block?.id ? null : <BackArrowNavLink to={backRoute} />}
              title={block?.id ? 'Edit Guided Image Hotspots' : 'Add Guided Image Hotspots'}
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
                    title={watchImageSelection ? 'Edit image' : 'Add image'}
                    icon={watchImageSelection ? Edit : Plus}
                    onClick={() => {
                      showModal(
                        'Insert Image', // title
                        (onClose) => (
                          <Suspense fallback={<Spinner />}>
                            <InsertMediaDialog
                              handleImageInsert={(file: SearchFileResult) => {
                                methods.setValue('content.image_id', file.id);
                                onClose();
                              }}
                            />
                          </Suspense>
                        ),
                        '', // className (empty string is fine)
                        <File />, // leadingIcon (null is valid)
                        'lg', // size (valid value from 'sm' | 'md' | 'lg' | 'full')
                      );
                    }}
                  />
                </div>

                {/* Content based on watchImageSelection */}
                <div className='border-border/20 min-h-20 w-full border'>
                  {watchImageSelection ? (
                    <Suspense fallback={<Spinner />}>
                      <LazyMediaInteractionImage imageId={getImageId} name='content.hotspots' />
                    </Suspense>
                  ) : (
                    <div className='max-w-ms mx-auto flex min-h-100 items-center justify-center md:max-w-lg'>
                      <div className='text-muted-foreground flex flex-col items-center'>
                        <ImageOff size={40} />
                        <p className='font-secondary py-2 text-xs'>No image</p>
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

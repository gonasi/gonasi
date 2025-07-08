import { useEffect, useState } from 'react';
import type { Area, Point } from 'react-easy-crop';
import Cropper from 'react-easy-crop';
import { Form, useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleX, Crop, LoaderCircle, Upload } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

// App logic and utils
import { editCourseImage } from '@gonasi/database/courses';
import { EditCourseImageSchema, type EditCourseImageSchemaTypes } from '@gonasi/schemas/courses';

import type { Route } from './+types/edit-thumbnail';

// Local types
// UI Components
import { Button } from '~/components/ui/button';
import { FormDescription } from '~/components/ui/forms/elements/Common';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Modal } from '~/components/ui/modal';
import { Slider } from '~/components/ui/slider';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

// Page metadata
export function meta() {
  return [
    { title: 'Edit Course Thumbnail - Gonasi' },
    {
      name: 'description',
      content: 'Give your course a fresh new look by updating its thumbnail!',
    },
  ];
}

// Zod resolver setup
const resolver = zodResolver(EditCourseImageSchema);

// Utility: Generate cropped image from selected area
const createCroppedImage = (
  imageSrc: string,
  pixelsCrop: Area,
  fileName: string = 'cropped-image.jpg',
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas context not available'));

    const image = new Image();
    image.onload = () => {
      canvas.width = pixelsCrop.width;
      canvas.height = pixelsCrop.height;

      ctx.drawImage(
        image,
        pixelsCrop.x,
        pixelsCrop.y,
        pixelsCrop.width,
        pixelsCrop.height,
        0,
        0,
        pixelsCrop.width,
        pixelsCrop.height,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas to blob conversion failed'));
          resolve(new File([blob], fileName, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.9,
      );
    };

    image.onerror = () => reject(new Error('Image loading failed'));
    image.src = imageSrc;
  });
};

// Server-side form handler
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData); // Bot protection

  const { supabase } = createClient(request);
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<EditCourseImageSchemaTypes>(formData, resolver);

  if (errors) return { errors, defaultValues };

  try {
    if (!(data.image instanceof File)) {
      return dataWithError(null, "Oops! That doesn't look like a valid image.");
    }

    const { success, message } = await editCourseImage(supabase, {
      ...data,
      courseId: params.courseId,
    });

    return success
      ? redirectWithSuccess(
          `/${params.organizationId}/builder/${params.courseId}/overview`,
          message,
        )
      : dataWithError(null, message);
  } catch (error) {
    console.error('Image processing error:', error);

    // Save image even if blur hash generation fails
    const { success, message } = await editCourseImage(supabase, {
      ...data,
      courseId: params.courseId,
    });

    return success
      ? redirectWithSuccess(
          `/${params.organizationId}/builder/${params.courseId}/overview`,
          message,
        )
      : dataWithError(null, 'Image saved but preview failed to generate.');
  }
}

// UI Component: Edit Course Thumbnail Page
export default function EditCourseImage() {
  const isPending = useIsPending();
  const params = useParams();

  const methods = useRemixForm<EditCourseImageSchemaTypes>({
    mode: 'all',
    resolver,
  });

  const isSubmitting = isPending || methods.formState.isSubmitting;

  // Local state
  const [loadingText, setLoadingText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showCropper, setShowCropper] = useState(false);

  // Handle file input
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOriginalFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // On crop change
  const onCropComplete = (_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  };

  // Apply crop and set image to form
  const handleCropConfirm = async () => {
    if (!selectedImage || !croppedAreaPixels || !originalFile) return;

    try {
      const croppedFile = await createCroppedImage(
        selectedImage,
        croppedAreaPixels,
        originalFile.name,
      );
      methods.setValue('image', croppedFile);
      setShowCropper(false);
    } catch (error) {
      console.error('Cropping failed:', error);
    }
  };

  // Cancel cropping
  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImage(null);
    setCroppedAreaPixels(null);
    setOriginalFile(null);
  };

  // Handle progressive loading text
  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;

    if (isSubmitting) {
      // Show first message after 1.5 seconds
      timer1 = setTimeout(() => {
        setLoadingText('Generating optimized image…');
      }, 1500);

      // Show second message after 3 seconds
      timer2 = setTimeout(() => {
        setLoadingText('Finishing up...');
      }, 4500);
    } else {
      setLoadingText('');
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isSubmitting]);

  return (
    <Modal open>
      <Modal.Content size={showCropper ? 'lg' : 'sm'}>
        <Modal.Header
          title={showCropper ? '✂️ Crop your thumbnail' : '🖼️ Update Course Thumbnail'}
          closeRoute={`/${params.organizationId}/builder/${params.courseId}/overview`}
        />
        <Modal.Body>
          {showCropper && selectedImage ? (
            // Cropper UI
            <div className='h-full space-y-4'>
              <div className='bg-card relative h-[50vh] w-full'>
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 9}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              <div className='space-y-2'>
                <Label className='text-sm font-medium'>Zoom</Label>
                <Slider
                  value={[zoom]}
                  onValueChange={([val]) => setZoom(val ?? 1)}
                  min={1}
                  max={3}
                  step={0.1}
                />
              </div>

              <div className='flex gap-2'>
                <Button variant='ghost' leftIcon={<CircleX />} onClick={handleCropCancel}>
                  Cancel
                </Button>
                <Button variant='secondary' onClick={handleCropConfirm} rightIcon={<Crop />}>
                  Apply crop
                </Button>
              </div>
            </div>
          ) : (
            // Form UI
            <RemixFormProvider {...methods}>
              <Form method='POST' encType='multipart/form-data' onSubmit={methods.handleSubmit}>
                <HoneypotInputs />

                <div className='space-y-4'>
                  <div>
                    <Label required className='text-sm font-medium'>
                      Course thumbnail
                    </Label>
                    <Input
                      type='file'
                      accept='image/*'
                      onChange={handleImageSelect}
                      disabled={isSubmitting}
                      className='w-full'
                      placeholder={originalFile ? originalFile.name : ''}
                    />
                    <FormDescription>Upload a fresh new look for your course ✨</FormDescription>
                  </div>

                  {/* Progressive loading messages */}
                  <AnimatePresence>
                    {loadingText && (
                      <motion.div
                        key={loadingText}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.25 }}
                        className='flex items-center space-x-2 pb-2'
                      >
                        <LoaderCircle size={10} className='animate-spin' />
                        <p className='font-secondary text-xs'>{loadingText}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    type='submit'
                    disabled={isPending || !methods.getValues('image')}
                    isLoading={isSubmitting}
                    rightIcon={<Upload />}
                  >
                    Save
                  </Button>
                </div>
              </Form>
            </RemixFormProvider>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

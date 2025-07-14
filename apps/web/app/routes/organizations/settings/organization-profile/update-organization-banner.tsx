import { useState } from 'react';
import type { Area, Point } from 'react-easy-crop';
import Cropper from 'react-easy-crop';
import { Form, useFetcher } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleX, Crop, Upload } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import {
  UpdateOrganizationBannerSchema,
  type UpdateOrganizationBannerSchemaTypes,
} from '@gonasi/schemas/organizations/settings/profile';

import type { Route } from './+types/update-organization-banner';

import { Button } from '~/components/ui/button';
import { FormDescription } from '~/components/ui/forms/elements/Common';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Modal } from '~/components/ui/modal';
import { Slider } from '~/components/ui/slider';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Update Organization Banner • Gonasi' },
    {
      name: 'description',
      content: 'Upload a new banner image to represent your organization.',
    },
  ];
}

const resolver = zodResolver(UpdateOrganizationBannerSchema);

const createCroppedImage = (
  imageSrc: string,
  cropArea: Area,
  fileName = 'cropped-banner.jpg',
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas context not available'));

    const image = new Image();
    image.onload = () => {
      canvas.width = cropArea.width;
      canvas.height = cropArea.height;

      ctx.drawImage(
        image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Failed to create image blob'));
          resolve(new File([blob], fileName, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.9,
      );
    };

    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = imageSrc;
  });
};

export default function UpdateOrganizationBanner({ params }: Route.ComponentProps) {
  const fetcher = useFetcher();
  const isPending = useIsPending();

  const closeActionRoute = `/${params.organizationId}/settings/organization-profile`;

  const methods = useRemixForm<UpdateOrganizationBannerSchemaTypes>({
    mode: 'all',
    resolver,
    fetcher,
    defaultValues: {
      updateType: 'organization-banner',
      organizationId: params.organizationId,
    },
    submitConfig: {
      method: 'POST',
      action: closeActionRoute,
      replace: false,
    },
  });

  const isSubmitting = isPending || methods.formState.isSubmitting;

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showCropper, setShowCropper] = useState(false);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setOriginalFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = (_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  };

  const handleCropConfirm = async () => {
    if (!selectedImage || !croppedAreaPixels || !originalFile) return;

    try {
      const cropped = await createCroppedImage(selectedImage, croppedAreaPixels, originalFile.name);
      methods.setValue('image', cropped);
      setShowCropper(false);
    } catch (err) {
      console.error('Cropping failed:', err);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImage(null);
    setOriginalFile(null);
    setCroppedAreaPixels(null);
  };

  return (
    <Modal open>
      <Modal.Content size={showCropper ? 'lg' : 'sm'}>
        <Modal.Header
          title={showCropper ? '✂️ Crop Image' : 'Update Organization Banner'}
          closeRoute={closeActionRoute}
        />
        <Modal.Body>
          {showCropper && selectedImage ? (
            <div className='h-full space-y-4'>
              <div className='bg-card relative h-[50vh] w-full'>
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={263 / 100}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              <div className='space-y-2'>
                <Label className='text-sm font-medium'>Zoom</Label>
                <Slider
                  value={[zoom]}
                  onValueChange={([z]) => setZoom(z ?? 1)}
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
            <RemixFormProvider {...methods}>
              <Form method='POST' encType='multipart/form-data' onSubmit={methods.handleSubmit}>
                <HoneypotInputs />
                <div className='space-y-4'>
                  <div>
                    <Label required className='text-sm font-medium'>
                      Banner Image
                    </Label>
                    <Input
                      type='file'
                      accept='image/*'
                      onChange={handleImageSelect}
                      disabled={isSubmitting}
                      className='w-full'
                      placeholder={originalFile?.name || 'Choose image'}
                    />
                    <FormDescription>
                      Upload a wide image to visually represent your organization.
                    </FormDescription>
                  </div>

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

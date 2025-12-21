import { lazy, Suspense, useState } from 'react';
import type { Area, Point } from 'react-easy-crop';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleX, Crop, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import type { Route } from './+types/update-profile-photo';

// UI components
import { Button } from '~/components/ui/button';
import { FormDescription } from '~/components/ui/forms/elements/Common';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Modal } from '~/components/ui/modal';
import { Progress } from '~/components/ui/progress';
import { Slider } from '~/components/ui/slider';
import { uploadToCloudinaryDirect, validateFile } from '~/utils/cloudinary-direct-upload';

// Lazy load the Cropper component to avoid SSR issues
const Cropper = lazy(() => import('react-easy-crop'));

// Page metadata
export function meta() {
  return [
    { title: 'Update Profile Photo • Gonasi' },
    {
      name: 'description',
      content: 'Upload a new profile picture to personalize your account.',
    },
  ];
}

// Create a cropped File from image source and area
const createCroppedImage = (
  imageSrc: string,
  cropArea: Area,
  fileName = 'cropped-image.jpg',
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

// UI component: Update Profile Photo
export default function UpdateProfilePhoto({ params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const closeActionRoute = `/go/${params.username}/settings/profile-information`;

  // Local state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
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
      const file = await createCroppedImage(selectedImage, croppedAreaPixels, originalFile.name);
      setCroppedFile(file);
      setShowCropper(false);
    } catch (error) {
      console.error('Cropping failed:', error);
      toast.error('Failed to crop image');
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImage(null);
    setOriginalFile(null);
    setCroppedAreaPixels(null);
    setCroppedFile(null);
  };

  // Handle profile photo upload
  const handleProfilePhotoUpload = async () => {
    if (!croppedFile) {
      toast.error('Please select and crop an image first');
      return;
    }

    // 1. Validate file
    const validation = validateFile(croppedFile, {
      maxSizeMB: 100,
      allowedTypes: ['image/*'],
    });

    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 2. Prepare upload - get signed parameters from server
      const prepareData = new FormData();
      prepareData.append('mimeType', croppedFile.type);
      prepareData.append('size', croppedFile.size.toString());

      const prepareResponse = await fetch('/api/users/prepare-profile-photo-upload', {
        method: 'POST',
        body: prepareData,
      });

      if (!prepareResponse.ok) {
        throw new Error('Failed to prepare upload');
      }

      const prepareResult = await prepareResponse.json();

      if (!prepareResult?.success) {
        throw new Error(prepareResult?.message || 'Failed to prepare upload');
      }

      const { uploadSignature } = prepareResult.data;

      // 3. Upload directly to Cloudinary
      const cloudinaryResponse = await uploadToCloudinaryDirect(croppedFile, uploadSignature, {
        onProgress: (progress) => {
          setUploadProgress(progress.percentage);
        },
      });

      // 4. Confirm upload with server
      const confirmData = new FormData();
      confirmData.append('cloudinaryPublicId', cloudinaryResponse.public_id);

      const confirmResponse = await fetch('/api/users/confirm-profile-photo-upload', {
        method: 'POST',
        body: confirmData,
      });

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm upload');
      }

      const confirmResult = await confirmResponse.json();

      if (!confirmResult?.success) {
        throw new Error(confirmResult?.message || 'Failed to confirm upload');
      }

      toast.success('Profile photo updated successfully!');
      setIsRedirecting(true);

      // Add cache buster to force reload
      const cacheBuster = Date.now();
      requestAnimationFrame(() => {
        navigate(`${closeActionRoute}?_=${cacheBuster}`);
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isDisabled = isUploading || isRedirecting;

  return (
    <Modal open>
      <Modal.Content size={showCropper ? 'lg' : 'sm'}>
        <Modal.Header
          title={showCropper ? '✂️ Crop Image' : 'Update Profile Picture'}
          closeRoute={closeActionRoute}
        />
        <Modal.Body>
          {showCropper && selectedImage ? (
            // Cropper UI
            <div className='h-full space-y-4'>
              <div className='bg-card relative h-[50vh] w-full'>
                <Suspense
                  fallback={
                    <div className='flex h-full items-center justify-center'>
                      <Loader2 className='animate-spin' />
                    </div>
                  }
                >
                  <Cropper
                    image={selectedImage}
                    crop={crop}
                    zoom={zoom}
                    aspect={1} // Square crop for profile photos
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </Suspense>
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
          ) : isRedirecting ? (
            // Redirecting UI
            <motion.div
              key='redirecting'
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className='flex flex-col items-center justify-center gap-4 py-12'
            >
              <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
              <p className='text-muted-foreground text-sm'>Finalizing upload…</p>
            </motion.div>
          ) : (
            // Upload UI
            <motion.div
              key='form'
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className='space-y-4'>
                <div>
                  <Label required className='text-sm font-medium'>
                    Profile Photo
                  </Label>
                  <Input
                    type='file'
                    accept='image/*'
                    onChange={handleImageSelect}
                    disabled={isDisabled}
                    className='w-full'
                  />
                  <FormDescription>Choose a new photo to represent you on Gonasi.</FormDescription>
                  {croppedFile && (
                    <p className='text-muted-foreground mt-2 text-xs'>
                      ✓ Image cropped and ready: {croppedFile.name}
                    </p>
                  )}
                </div>

                {/* Upload Progress */}
                <AnimatePresence>
                  {isUploading && uploadProgress > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className='space-y-2 overflow-hidden'
                    >
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        style={{ originX: 0 }}
                      >
                        <Progress value={uploadProgress} />
                      </motion.div>

                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className='text-sm text-gray-600 dark:text-gray-400'
                      >
                        Uploading: {uploadProgress}%
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  onClick={handleProfilePhotoUpload}
                  disabled={isDisabled || !croppedFile}
                  isLoading={isDisabled}
                  rightIcon={<Upload />}
                >
                  {isUploading ? 'Uploading...' : 'Save'}
                </Button>
              </div>
            </motion.div>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

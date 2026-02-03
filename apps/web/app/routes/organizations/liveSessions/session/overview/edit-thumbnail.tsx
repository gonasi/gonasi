import { lazy, useState } from 'react';
import type { Area, Point } from 'react-easy-crop';
import { useNavigate, useParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleX, Crop, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

// UI Components
import { Button } from '~/components/ui/button';
import { FormDescription } from '~/components/ui/forms/elements/Common';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Modal } from '~/components/ui/modal';
import { Progress } from '~/components/ui/progress';
import { Slider } from '~/components/ui/slider';
import { uploadToCloudinaryDirect, validateFile } from '~/utils/cloudinary-direct-upload';

const Cropper = lazy(() => import('react-easy-crop'));

// Page metadata
export function meta() {
  return [
    { title: 'Edit Live Session Thumbnail - Gonasi' },
    {
      name: 'description',
      content: 'Give your live session a fresh new look by updating its thumbnail!',
    },
  ];
}

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

// UI Component: Edit Live Session Thumbnail Page
export default function EditLiveSessionThumbnail() {
  const navigate = useNavigate();
  const params = useParams();

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

  // Apply crop and save to state
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

  // Cancel cropping
  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImage(null);
    setCroppedAreaPixels(null);
    setOriginalFile(null);
    setCroppedFile(null);
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = async () => {
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
      prepareData.append('sessionId', params.sessionId!);
      prepareData.append('organizationId', params.organizationId!);
      prepareData.append('mimeType', croppedFile.type);
      prepareData.append('size', croppedFile.size.toString());

      const prepareResponse = await fetch('/api/liveSessions/prepare-thumbnail-upload', {
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
      confirmData.append('sessionId', params.sessionId!);
      confirmData.append('cloudinaryPublicId', cloudinaryResponse.public_id);

      const confirmResponse = await fetch('/api/liveSessions/confirm-thumbnail-upload', {
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

      toast.success('Thumbnail updated successfully!');
      setIsRedirecting(true);

      // Add cache buster to force reload
      const cacheBuster = Date.now();
      requestAnimationFrame(() => {
        navigate(
          `/${params.organizationId}/live-sessions/${params.sessionId}/overview?_=${cacheBuster}`,
        );
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
          title={showCropper ? '✂️ Crop your thumbnail' : '🖼️ Update Session Thumbnail'}
          closeRoute={`/${params.organizationId}/live-sessions/${params.sessionId}/overview`}
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
                    Session thumbnail
                  </Label>
                  <Input
                    type='file'
                    accept='image/*'
                    onChange={handleImageSelect}
                    disabled={isDisabled}
                    className='w-full'
                  />
                  <FormDescription>Upload a fresh new look for your session ✨</FormDescription>
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
                  onClick={handleThumbnailUpload}
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

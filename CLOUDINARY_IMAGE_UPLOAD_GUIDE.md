# Cloudinary Image Upload Implementation Guide

This guide provides a complete end-to-end implementation pattern for uploading **images only** to Cloudinary in the Gonasi application. This pattern is based on the existing file upload implementation in the codebase.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implementation Flow](#implementation-flow)
4. [Required Components](#required-components)
5. [Step-by-Step Implementation](#step-by-step-implementation)
6. [Security Considerations](#security-considerations)
7. [Error Handling](#error-handling)
8. [Testing](#testing)

---

## Overview

The Cloudinary direct upload pattern enables client-side file uploads directly to Cloudinary, bypassing the server entirely. This approach offers several benefits:

- **No server timeouts**: Files never pass through your server
- **No memory issues**: Large files don't consume server memory
- **Better UX**: Real-time upload progress tracking
- **Scalability**: Cloudinary handles all file processing

### Upload Flow Diagram

```
┌─────────┐    1. Prepare    ┌────────┐    2. Generate    ┌──────────┐
│ Client  │ ───────────────> │ Server │ ──────────────────>│Cloudinary│
│         │                  │        │                    │  SDK     │
└─────────┘                  └────────┘                    └──────────┘
     │                            │                              │
     │    ← uploadSignature ──────┘                              │
     │                                                            │
     │    3. Direct Upload                                       │
     │ ──────────────────────────────────────────────────────────>│
     │                                                            │
     │    ← CloudinaryResponse ────────────────────────────────────┘
     │
     │         4. Confirm      ┌────────┐    5. Save DB    ┌──────────┐
     └────────────────────────>│ Server │ ────────────────>│ Database │
                               └────────┘                  └──────────┘
```

---

## Architecture

### Three-Phase Upload Process

#### **Phase 1: Prepare Upload**
- Client sends image metadata (name, size, mimeType)
- Server validates storage quota
- Server generates signed Cloudinary upload credentials
- Server returns `fileId` and `uploadSignature`

#### **Phase 2: Direct Upload**
- Client uploads image directly to Cloudinary using signature
- Progress tracking via XMLHttpRequest
- Cloudinary processes and stores the image
- Cloudinary returns upload response (publicId, url, bytes, etc.)

#### **Phase 3: Confirm Upload**
- Client sends Cloudinary response to server
- Server creates database record with file metadata
- Server returns success confirmation

---

## Implementation Flow

### Files & Folders to Create/Modify

```
apps/web/app/
├── routes/
│   ├── api/
│   │   └── images/
│   │       ├── prepare-upload.ts          # NEW: API route for prepare
│   │       └── confirm-upload.ts          # NEW: API route for confirm
│   └── [your-feature]/
│       └── upload-image.tsx               # NEW: Upload UI component
│
shared/
├── database/src/
│   └── images/                            # NEW: Database functions folder
│       ├── prepareImageUpload.ts          # NEW: Prepare function
│       ├── confirmImageUpload.ts          # NEW: Confirm function
│       └── index.ts                       # NEW: Export functions
│
├── gonasi-schemas/src/
│   └── image/
│       └── index.ts                       # NEW: Image validation schemas
│
└── cloudinary/src/
    ├── generateUploadSignature.ts         # EXISTING: Already available
    ├── helpers.ts                         # EXISTING: Already available
    └── index.ts                           # EXISTING: Already available
```

---

## Required Components

### 1. Zod Validation Schema

**File**: `shared/gonasi-schemas/src/image/index.ts`

```typescript
import { z } from 'zod';

// Constants
export const MAX_IMAGE_SIZE = 1024 * 1024 * 10; // 10MB for images

export enum ImageType {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp',
  GIF = 'gif',
  SVG = 'svg',
}

export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

// Utility Functions
export const getImageExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const isImageFile = (file: File): boolean => {
  const extension = getImageExtension(file.name);
  return ALLOWED_IMAGE_EXTENSIONS.includes(extension) ||
         ALLOWED_IMAGE_MIME_TYPES.includes(file.type);
};

// Validation Schemas
export const ImageNameSchema = z
  .string({
    required_error: 'Please provide an image name.',
  })
  .min(3, { message: 'Image name must be at least 3 characters.' })
  .max(100, { message: 'Image name must be under 100 characters.' })
  .refine((val) => /^[\w\d\-_. ]+$/.test(val), {
    message: 'Use only letters, numbers, spaces, dashes, underscores, or dots.',
  });

export const NewImageFileSchema = z.instanceof(File).superRefine((file, ctx) => {
  // Check if file is selected
  if (file.size === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select an image file.',
    });
    return;
  }

  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Image size must be under ${MAX_IMAGE_SIZE / 1024 / 1024}MB.`,
    });
    return;
  }

  // Check file type
  const extension = getImageExtension(file.name);
  const isValidMimeType = ALLOWED_IMAGE_MIME_TYPES.includes(file.type);
  const isValidExtension = ALLOWED_IMAGE_EXTENSIONS.includes(extension);

  if (!isValidMimeType && !isValidExtension) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Only image files are allowed (${ALLOWED_IMAGE_EXTENSIONS.join(', ')}).`,
    });
  }
});

export const NewImageUploadSchema = z.object({
  file: NewImageFileSchema,
  name: ImageNameSchema,
  // Add context-specific IDs as needed
  organizationId: z.string().optional(),
  courseId: z.string().optional(),
  userId: z.string().optional(),
});

export type NewImageUploadSchemaTypes = z.infer<typeof NewImageUploadSchema>;
```

---

### 2. Database Functions

#### **Prepare Upload Function**

**File**: `shared/database/src/images/prepareImageUpload.ts`

```typescript
import {
  generatePublicId,
  generateUploadSignature,
  type UploadSignature,
} from '@gonasi/cloudinary';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

export interface PrepareImageUploadParams {
  name: string;
  fileName: string;
  mimeType: string;
  size: number;
  // Context IDs (adjust based on your needs)
  organizationId?: string;
  courseId?: string;
  userId?: string;
}

export interface PrepareImageUploadResponse {
  imageId: string;
  uploadSignature: UploadSignature;
}

/**
 * Prepares for a client-side direct image upload to Cloudinary.
 *
 * This function:
 * 1. Validates the image type
 * 2. Generates a unique image ID
 * 3. Creates a signed upload URL for direct client → Cloudinary upload
 *
 * @param supabase - Supabase client
 * @param params - Image metadata
 * @returns Upload signature for client-side upload
 */
export const prepareImageUpload = async (
  supabase: TypedSupabaseClient,
  params: PrepareImageUploadParams,
): Promise<ApiResponse<PrepareImageUploadResponse>> => {
  const userId = await getUserId(supabase);
  const { name, fileName, mimeType, size, organizationId, courseId } = params;

  try {
    // Validate that it's an image MIME type
    if (!mimeType.startsWith('image/')) {
      return {
        success: false,
        message: 'Only image files are allowed.',
      };
    }

    // Optional: Add storage quota check if needed
    // const hasSpace = await checkStorageQuota(supabase, organizationId, size);
    // if (!hasSpace) { return error }

    // Generate unique image ID
    const imageId = crypto.randomUUID();

    // Generate Cloudinary public_id
    // Adjust the pattern based on your needs
    const publicId = generatePublicId({
      scope: 'draft',
      resourceType: 'file', // or 'thumbnail', 'profile', etc.
      organizationId,
      courseId,
      fileId: imageId,
    });

    // Always use 'image' resource type for images
    const resourceType = 'image';

    // Generate signed upload parameters
    const uploadSignature = generateUploadSignature({
      publicId,
      resourceType,
      tags: ['image', 'draft', organizationId, courseId].filter(Boolean) as string[],
      context: {
        organizationId: organizationId || '',
        courseId: courseId || '',
        userId,
        originalName: name,
        fileType: 'image',
      },
      maxFileSize: size * 1.1, // Allow 10% buffer for encoding
    });

    return {
      success: true,
      message: 'Upload signature generated.',
      data: {
        imageId,
        uploadSignature,
      },
    };
  } catch (error) {
    console.error('[prepareImageUpload] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Failed to prepare image upload: ${errorMessage}`,
    };
  }
};
```

#### **Confirm Upload Function**

**File**: `shared/database/src/images/confirmImageUpload.ts`

```typescript
import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

export interface ConfirmImageUploadParams {
  imageId: string;
  name: string;
  fileName: string;
  cloudinaryPublicId: string;
  size: number;
  mimeType: string;
  width?: number;  // Cloudinary returns these for images
  height?: number;
  // Context IDs
  organizationId?: string;
  courseId?: string;
}

/**
 * Confirms an image upload after client-side direct upload to Cloudinary completes.
 *
 * Creates the database record with the Cloudinary upload details.
 *
 * IMPORTANT: Replace 'your_images_table' with your actual table name
 *
 * @param supabase - Supabase client
 * @param params - Image metadata from Cloudinary upload response
 * @returns Success/failure status
 */
export const confirmImageUpload = async (
  supabase: TypedSupabaseClient,
  params: ConfirmImageUploadParams,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const {
    imageId,
    name,
    fileName,
    cloudinaryPublicId,
    size,
    mimeType,
    width,
    height,
    organizationId,
    courseId,
  } = params;

  try {
    // Extract extension from filename
    const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';

    // Insert image record in database
    // IMPORTANT: Replace 'your_images_table' with your actual table name
    const { error: insertError } = await supabase.from('your_images_table').insert({
      id: imageId,
      name,
      path: cloudinaryPublicId,
      size,
      mime_type: mimeType,
      extension,
      width,
      height,
      organization_id: organizationId,
      course_id: courseId,
      created_by: userId,
      updated_by: userId,
    });

    if (insertError) {
      console.error('[confirmImageUpload] Database insert failed:', insertError);
      return {
        success: false,
        message: `Failed to save image metadata: ${insertError.message}`,
      };
    }

    return {
      success: true,
      message: 'Image uploaded successfully.',
    };
  } catch (error) {
    console.error('[confirmImageUpload] Error:', error);
    return {
      success: false,
      message: 'Failed to confirm image upload.',
    };
  }
};
```

#### **Export Functions**

**File**: `shared/database/src/images/index.ts`

```typescript
export { prepareImageUpload, type PrepareImageUploadParams, type PrepareImageUploadResponse } from './prepareImageUpload';
export { confirmImageUpload, type ConfirmImageUploadParams } from './confirmImageUpload';
```

---

### 3. API Routes

#### **Prepare Upload Route**

**File**: `apps/web/app/routes/api/images/prepare-upload.ts`

```typescript
import { prepareImageUpload } from '@gonasi/database/images';

import type { Route } from './+types/prepare-upload';

import { createClient } from '~/lib/supabase/supabase.server';

/**
 * API route to prepare an image upload by generating a signed Cloudinary upload URL.
 *
 * This enables direct client-to-Cloudinary uploads for images only.
 */
export async function action({ request }: Route.ActionArgs) {
  const { supabase } = createClient(request);
  const formData = await request.formData();

  const result = await prepareImageUpload(supabase, {
    name: formData.get('name') as string,
    fileName: formData.get('fileName') as string,
    mimeType: formData.get('mimeType') as string,
    size: Number(formData.get('size')),
    organizationId: formData.get('organizationId') as string | undefined,
    courseId: formData.get('courseId') as string | undefined,
  });

  return result;
}
```

#### **Confirm Upload Route**

**File**: `apps/web/app/routes/api/images/confirm-upload.ts`

```typescript
import { confirmImageUpload } from '@gonasi/database/images';

import type { Route } from './+types/confirm-upload';

import { createClient } from '~/lib/supabase/supabase.server';

/**
 * API route to confirm an image upload after client-side direct upload to Cloudinary completes.
 */
export async function action({ request }: Route.ActionArgs) {
  const { supabase } = createClient(request);
  const formData = await request.formData();

  const result = await confirmImageUpload(supabase, {
    imageId: formData.get('imageId') as string,
    name: formData.get('name') as string,
    fileName: formData.get('fileName') as string,
    cloudinaryPublicId: formData.get('cloudinaryPublicId') as string,
    size: Number(formData.get('size')),
    mimeType: formData.get('mimeType') as string,
    width: formData.get('width') ? Number(formData.get('width')) : undefined,
    height: formData.get('height') ? Number(formData.get('height')) : undefined,
    organizationId: formData.get('organizationId') as string | undefined,
    courseId: formData.get('courseId') as string | undefined,
  });

  return result;
}
```

---

### 4. Client-Side Utilities

**File**: `apps/web/app/utils/cloudinary-image-upload.ts`

```typescript
import type { UploadSignature } from '@gonasi/cloudinary';

export interface CloudinaryImageUploadResponse {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  type: string;
  url: string;
  secure_url: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ImageUploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

/**
 * Uploads an image directly to Cloudinary using a signed upload URL.
 *
 * @param file - Image file to upload
 * @param signature - Signed upload parameters from server
 * @param options - Upload options (progress callback, abort signal)
 * @returns Cloudinary upload response
 */
export async function uploadImageToCloudinary(
  file: File,
  signature: UploadSignature,
  options: ImageUploadOptions = {},
): Promise<CloudinaryImageUploadResponse> {
  const { onProgress, signal } = options;

  // Build upload URL - always use 'image' resource type
  const uploadUrl = `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`;

  // Build form data with signed parameters
  const formData = new FormData();

  formData.append('file', file);
  formData.append('public_id', signature.publicId);
  formData.append('timestamp', signature.timestamp.toString());
  formData.append('signature', signature.signature);
  formData.append('api_key', signature.apiKey);
  formData.append('type', 'authenticated'); // Private file storage
  formData.append('overwrite', 'true');
  formData.append('invalidate', 'true');

  if (signature.tags) {
    formData.append('tags', signature.tags);
  }

  if (signature.context) {
    formData.append('context', signature.context);
  }

  if (signature.maxBytes) {
    formData.append('max_bytes', signature.maxBytes.toString());
  }

  // Upload with progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });
    }

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(
            new Error(errorResponse.error?.message || `Upload failed with status ${xhr.status}`),
          );
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
      });
    }

    // Send request
    xhr.open('POST', uploadUrl);
    xhr.send(formData);
  });
}

/**
 * Validates that a file is an image and meets size requirements.
 *
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default: 10MB)
 * @returns Validation result
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10,
): { valid: boolean; error?: string } {
  // Check file size
  const fileSizeMB = file.size / 1024 / 1024;
  if (fileSizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `Image size (${fileSizeMB.toFixed(2)} MB) exceeds maximum allowed size (${maxSizeMB} MB)`,
    };
  }

  // Check if it's an image file
  const isImage = file.type.startsWith('image/');
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const extension = file.name.split('.').pop()?.toLowerCase();
  const hasImageExtension = extension && imageExtensions.includes(extension);

  if (!isImage && !hasImageExtension) {
    return {
      valid: false,
      error: `File type "${file.type}" is not an image. Allowed types: ${imageExtensions.join(', ')}`,
    };
  }

  return { valid: true };
}
```

---

### 5. React Component (Upload UI)

**File**: `apps/web/app/routes/[your-feature]/upload-image.tsx`

```typescript
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { NewImageUploadSchema, type NewImageUploadSchemaTypes } from '@gonasi/schemas/image';

import type { Route } from './+types/upload-image';

import { Button } from '~/components/ui/button';
import { GoFileField, GoInputField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { Progress } from '~/components/ui/progress';
import { uploadImageToCloudinary, validateImageFile } from '~/utils/cloudinary-image-upload';

const resolver = zodResolver(NewImageUploadSchema);

export default function UploadImage({ params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const methods = useForm<NewImageUploadSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      organizationId: params.organizationId,
      courseId: params.courseId,
    },
  });

  // Auto-populate name from filename
  const selectedFile = methods.watch('file');

  useEffect(() => {
    if (selectedFile && selectedFile instanceof File) {
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
      methods.setValue('name', fileName, { shouldValidate: true });
    }
  }, [selectedFile, methods]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    methods.handleSubmit((formData) => {
      handleImageUpload(formData);
    })(e);
  };

  const handleImageUpload = async (formData: NewImageUploadSchemaTypes) => {
    const file = formData.file;

    if (!file) {
      toast.error('Please select an image to upload');
      return;
    }

    // Validate image file
    const validation = validateImageFile(file, 10); // 10MB max

    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Prepare upload
      const prepareData = new FormData();
      prepareData.append('name', formData.name);
      prepareData.append('fileName', file.name);
      prepareData.append('mimeType', file.type);
      prepareData.append('size', file.size.toString());
      if (formData.organizationId) prepareData.append('organizationId', formData.organizationId);
      if (formData.courseId) prepareData.append('courseId', formData.courseId);

      const prepareResponse = await fetch('/api/images/prepare-upload', {
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

      const { imageId, uploadSignature } = prepareResult.data;

      // Step 2: Upload directly to Cloudinary
      const cloudinaryResponse = await uploadImageToCloudinary(file, uploadSignature, {
        onProgress: (progress) => {
          setUploadProgress(progress.percentage);
        },
      });

      // Step 3: Confirm upload
      const confirmData = new FormData();
      confirmData.append('imageId', imageId);
      confirmData.append('name', formData.name);
      confirmData.append('fileName', file.name);
      confirmData.append('cloudinaryPublicId', cloudinaryResponse.public_id);
      confirmData.append('size', cloudinaryResponse.bytes.toString());
      confirmData.append('mimeType', file.type);
      confirmData.append('width', cloudinaryResponse.width.toString());
      confirmData.append('height', cloudinaryResponse.height.toString());
      if (formData.organizationId) confirmData.append('organizationId', formData.organizationId);
      if (formData.courseId) confirmData.append('courseId', formData.courseId);

      const confirmResponse = await fetch('/api/images/confirm-upload', {
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

      // Success!
      toast.success('Image uploaded successfully!');
      setIsRedirecting(true);

      // Navigate to success page
      requestAnimationFrame(() => {
        navigate(`/${params.organizationId}/success`);
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isDisabled = isUploading || methods.formState.isSubmitting || isRedirecting;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          title='Upload Image'
          closeRoute={`/${params.organizationId}/back`}
        />

        <Modal.Body>
          <AnimatePresence mode='wait'>
            {isRedirecting ? (
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
              <motion.div
                key='form'
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <FormProvider {...methods}>
                  <form onSubmit={handleSubmit}>
                    <GoFileField
                      name='file'
                      labelProps={{ children: 'Upload image', required: true }}
                      inputProps={{
                        disabled: isDisabled,
                        accept: 'image/*'  // Only allow images
                      }}
                      description='Choose an image file to upload (max 10MB).'
                    />

                    <GoInputField
                      name='name'
                      labelProps={{ children: 'Image name', required: true }}
                      inputProps={{ disabled: isDisabled }}
                      description='Enter a name for your image.'
                    />

                    <AnimatePresence>
                      {isUploading && uploadProgress > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className='mt-4 space-y-2 overflow-hidden'
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
                      type='submit'
                      disabled={isDisabled}
                      isLoading={isDisabled}
                      className='mt-4'
                    >
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  </form>
                </FormProvider>
              </motion.div>
            )}
          </AnimatePresence>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
```

---

## Security Considerations

### 1. **Authenticated Uploads**
All uploads use `type: 'authenticated'` in Cloudinary, ensuring files are private and require signed URLs to access.

### 2. **Signature Validation**
The upload signature is generated server-side with a timestamp and secure API secret. It expires after use.

### 3. **File Type Validation**
- **Client-side**: Validate MIME type and extension before upload
- **Server-side**: Verify MIME type starts with `image/` in `prepareImageUpload`
- **Cloudinary**: Set resource_type to `'image'` to enforce image processing

### 4. **Size Limits**
- **Schema**: Zod validation enforces 10MB max
- **Client**: `validateImageFile` checks file size
- **Server**: `maxFileSize` parameter in signature limits upload size
- **Cloudinary**: `max_bytes` parameter enforces hard limit

### 5. **User Authorization**
- Always use `getUserId(supabase)` to get authenticated user
- Validate user permissions before generating upload signature
- Example: Check if user can upload to specific organization/course

```typescript
// In prepareImageUpload.ts
const canUpload = await supabase.rpc('can_user_upload_to_course', {
  arg_course_id: courseId,
});

if (!canUpload.data) {
  return {
    success: false,
    message: 'You are not authorized to upload images to this course.',
  };
}
```

---

## Error Handling

### Common Error Scenarios

#### 1. **Network Errors During Upload**
```typescript
try {
  const cloudinaryResponse = await uploadImageToCloudinary(file, uploadSignature, {
    onProgress: setUploadProgress,
  });
} catch (error) {
  if (error.message === 'Network error during upload') {
    toast.error('Network error. Please check your connection and try again.');
  }
}
```

#### 2. **Upload Cancelled**
```typescript
const abortController = new AbortController();

// Cancel upload
const handleCancel = () => {
  abortController.abort();
};

// Upload with abort signal
await uploadImageToCloudinary(file, uploadSignature, {
  signal: abortController.signal,
});
```

#### 3. **File Size Exceeded**
Cloudinary will reject uploads that exceed `max_bytes`:
```typescript
{
  "error": {
    "message": "File size too large"
  }
}
```

#### 4. **Invalid Signature**
If signature is tampered with or expired:
```typescript
{
  "error": {
    "message": "Invalid signature"
  }
}
```

#### 5. **Database Insert Failure**
Handle gracefully in `confirmImageUpload`:
```typescript
if (insertError) {
  // Image is on Cloudinary but not in DB
  // Consider cleanup job or manual reconciliation
  console.error('Database insert failed:', insertError);

  return {
    success: false,
    message: 'Upload succeeded but failed to save metadata. Please contact support.',
  };
}
```

---

## Testing

### Manual Testing Checklist

- [ ] **Valid image upload** (JPEG, PNG, WebP, GIF, SVG)
- [ ] **Invalid file type** (PDF, video, etc.) - should be rejected
- [ ] **File size validation** - Test with file > 10MB
- [ ] **Progress tracking** - Verify progress bar updates
- [ ] **Network interruption** - Test with throttled connection
- [ ] **Upload cancellation** - Test abort functionality
- [ ] **Duplicate upload** - Test overwrite behavior
- [ ] **Database record creation** - Verify data saved correctly
- [ ] **Cloudinary storage** - Verify file exists in Cloudinary dashboard
- [ ] **Signed URL retrieval** - Test accessing uploaded image

### Automated Tests

**File**: `shared/database/src/images/__tests__/prepareImageUpload.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { prepareImageUpload } from '../prepareImageUpload';

describe('prepareImageUpload', () => {
  it('should reject non-image files', async () => {
    const result = await prepareImageUpload(mockSupabase, {
      name: 'document',
      fileName: 'doc.pdf',
      mimeType: 'application/pdf',
      size: 1000000,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('Only image files are allowed');
  });

  it('should generate upload signature for valid images', async () => {
    const result = await prepareImageUpload(mockSupabase, {
      name: 'photo',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      size: 1000000,
    });

    expect(result.success).toBe(true);
    expect(result.data?.imageId).toBeDefined();
    expect(result.data?.uploadSignature).toBeDefined();
  });
});
```

---

## Database Schema Example

Create a table to store image metadata:

```sql
CREATE TABLE images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  path text NOT NULL, -- Cloudinary public_id
  size bigint NOT NULL,
  mime_type text NOT NULL,
  extension text NOT NULL,
  width integer,
  height integer,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  updated_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_images_organization ON images(organization_id);
CREATE INDEX idx_images_course ON images(course_id);
CREATE INDEX idx_images_created_by ON images(created_by);

-- RLS Policies
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view images in their organizations"
  ON images FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload images to their organizations"
  ON images FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

---

## Environment Variables

Ensure these are set in your `.env` file:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Initialize Cloudinary in your app:

**File**: `shared/cloudinary/src/client.ts` (should already exist)

```typescript
import { v2 as cloudinary } from 'cloudinary';

export const initCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
};

export const getCloudinary = () => cloudinary;
```

---

## Complete Implementation Checklist

### Backend
- [ ] Create `shared/gonasi-schemas/src/image/index.ts` with validation schemas
- [ ] Create `shared/database/src/images/prepareImageUpload.ts`
- [ ] Create `shared/database/src/images/confirmImageUpload.ts`
- [ ] Create `shared/database/src/images/index.ts` (exports)
- [ ] Create `apps/web/app/routes/api/images/prepare-upload.ts`
- [ ] Create `apps/web/app/routes/api/images/confirm-upload.ts`
- [ ] Create database table for storing image metadata
- [ ] Add RLS policies for security
- [ ] Set up Cloudinary environment variables

### Frontend
- [ ] Create `apps/web/app/utils/cloudinary-image-upload.ts`
- [ ] Create upload UI component (or integrate into existing form)
- [ ] Add file input with `accept="image/*"` attribute
- [ ] Implement progress tracking UI
- [ ] Add error handling and user feedback
- [ ] Test upload flow end-to-end

### Testing
- [ ] Write unit tests for validation functions
- [ ] Write integration tests for database functions
- [ ] Manual testing of upload flow
- [ ] Test error scenarios (network, file type, size, etc.)
- [ ] Verify Cloudinary storage and signed URL access

---

## Key Differences from Generic File Upload

When implementing image-only uploads, note these important differences:

1. **Resource Type**: Always use `resourceType: 'image'` instead of `'raw'` or `'auto'`
2. **File Validation**: Restrict to image MIME types and extensions only
3. **Size Limit**: Images typically have lower size limits (10MB vs 100MB for files)
4. **Metadata**: Images have `width` and `height` properties from Cloudinary
5. **Transformations**: Images support Cloudinary transformations (resize, crop, format conversion)
6. **Upload URL**: Use `/image/upload` endpoint instead of `/raw/upload` or `/auto/upload`

---

## Additional Resources

- **Cloudinary Direct Upload Docs**: https://cloudinary.com/documentation/upload_images#uploading_with_a_direct_call_to_the_api
- **Signed Upload Parameters**: https://cloudinary.com/documentation/upload_images#generating_authentication_signatures
- **Image Transformations**: https://cloudinary.com/documentation/image_transformations
- **React Hook Form**: https://react-hook-form.com/
- **Zod Validation**: https://zod.dev/

---

## Summary

This implementation pattern provides:

✅ **Secure** - Authenticated uploads with server-side signature generation
✅ **Scalable** - Direct client-to-Cloudinary uploads bypass server bottlenecks
✅ **User-friendly** - Real-time progress tracking and error handling
✅ **Type-safe** - Full TypeScript support with Zod validation
✅ **Tested** - Comprehensive validation and error scenarios covered

Follow this guide to implement image uploads in any part of your Gonasi application. Adjust context IDs (organizationId, courseId, userId) and database table names based on your specific use case.

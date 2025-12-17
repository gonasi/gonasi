import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { data, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { redirectWithError } from 'remix-toast';
import { toast } from 'sonner';

import { NewFileLibrarySchema, type NewFileSchemaTypes } from '@gonasi/schemas/file';

import type { Route } from './+types/new-file';

import { Button } from '~/components/ui/button';
import { GoFileField, GoInputField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { Progress } from '~/components/ui/progress';
import { createClient } from '~/lib/supabase/supabase.server';
import { uploadToCloudinaryDirect, validateFile } from '~/utils/cloudinary-direct-upload';

const resolver = zodResolver(NewFileLibrarySchema);

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const canEdit = await supabase.rpc('can_user_edit_course', {
    arg_course_id: params.courseId,
  });

  if (!canEdit.data) {
    return redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/file-library`,
      'You are not authorized to create a new file',
    );
  }

  return data(true);
}

export default function NewFile({ params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const methods = useForm<NewFileSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      courseId: params.courseId,
      organizationId: params.organizationId,
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    methods.handleSubmit((formData) => {
      handleFileUpload(formData);
    })(e);
  };

  const handleFileUpload = async (formData: NewFileSchemaTypes) => {
    const file = formData.file;

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    // 1. Validate file
    const validation = validateFile(file, {
      maxSizeMB: 100,
      allowedTypes: [
        // Images
        'image/*',
        // Audio
        'audio/*',
        // Video
        'video/*',
        // 3D Models
        'model/*',
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        // Fallback for other types
        'application/octet-stream',
      ],
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

      prepareData.append('name', formData.name);
      prepareData.append('mimeType', file.type);
      prepareData.append('size', file.size.toString());
      prepareData.append('courseId', params.courseId);
      prepareData.append('organizationId', params.organizationId);

      const prepareResponse = await fetch('/api/files/prepare-upload', {
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

      const { fileId, uploadSignature } = prepareResult.data;

      // 3. Upload directly to Cloudinary
      const cloudinaryResponse = await uploadToCloudinaryDirect(file, uploadSignature, {
        onProgress: (progress) => {
          setUploadProgress(progress.percentage);
        },
      });

      // 4. Confirm upload with server
      const confirmData = new FormData();

      confirmData.append('fileId', fileId);
      confirmData.append('name', formData.name);
      confirmData.append('courseId', params.courseId);
      confirmData.append('organizationId', params.organizationId);
      confirmData.append('cloudinaryPublicId', cloudinaryResponse.public_id);
      confirmData.append('size', cloudinaryResponse.bytes.toString());
      confirmData.append('mimeType', file.type);

      const confirmResponse = await fetch('/api/files/confirm-upload', {
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

      toast.success('File uploaded successfully!');
      navigate(`/${params.organizationId}/builder/${params.courseId}/file-library`);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isDisabled = isUploading || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          title='Course File Upload'
          closeRoute={`/${params.organizationId}/builder/${params.courseId}/file-library`}
        />
        <Modal.Body>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit}>
              <GoFileField
                name='file'
                labelProps={{ children: 'Upload file', required: true }}
                inputProps={{
                  disabled: isDisabled,
                }}
                description='Choose a file to upload (max 100MB).'
              />
              <GoInputField
                labelProps={{ children: 'File name', required: true }}
                inputProps={{
                  disabled: isDisabled,
                }}
                name='name'
                description='Enter a name for your file.'
              />

              {isUploading && uploadProgress > 0 && (
                <div className='mt-4 space-y-2'>
                  <Progress value={uploadProgress} />

                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    Uploading: {uploadProgress}%
                  </p>
                </div>
              )}

              <Button type='submit' disabled={isDisabled} isLoading={isDisabled} className='mt-4'>
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </form>
          </FormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

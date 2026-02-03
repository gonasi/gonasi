import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { data, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { redirectWithError } from 'remix-toast';
import { toast } from 'sonner';

import { fetchFileById } from '@gonasi/database/files';
import { EditFileSchema, type EditFileSchemaTypes } from '@gonasi/schemas/file';

import type { Route } from './+types/edit-file-image';

import { Button } from '~/components/ui/button';
import { GoFileField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { Progress } from '~/components/ui/progress';
import { createClient } from '~/lib/supabase/supabase.server';
import { uploadToCloudinaryDirect, validateFile } from '~/utils/cloudinary-direct-upload';

const resolver = zodResolver(EditFileSchema);

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [file, canEdit] = await Promise.all([
    fetchFileById({ supabase, fileId: params.fileId, mode: 'preview' }),
    supabase.rpc('can_user_edit_course', {
      arg_course_id: params.courseId,
    }),
  ]);

  if (!canEdit.data) {
    return redirectWithError(
      `/${params.organizationId}/courses/${params.courseId}/file-library`,
      'You are not authorized to edit this file',
    );
  }

  if (file.data === null) {
    return redirectWithError(
      `/${params.organizationId}/courses/${params.courseId}/file-library`,
      'File does not exist',
    );
  }

  return data(file.data);
}

export default function EditFileImage({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const methods = useForm<EditFileSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      path: loaderData.path,
      fileId: loaderData.id,
      organizationId: loaderData.organization_id,
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    methods.handleSubmit((formData) => {
      handleFileEdit(formData);
    })(e);
  };

  const handleFileEdit = async (formData: EditFileSchemaTypes) => {
    const file = formData.file;

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    // Map database file_type to category
    const getFileCategoryFromDbType = (dbFileType: string): string => {
      if (dbFileType === 'image') return 'image';
      if (dbFileType === 'video') return 'video';
      if (dbFileType === 'audio') return 'audio';
      if (dbFileType === 'model3d') return 'model';
      if (dbFileType === 'document') return 'document';
      return 'other';
    };

    // Determine new file's category from MIME type or extension
    const getNewFileCategory = (mimeType: string, fileName: string): string => {
      if (mimeType.startsWith('image/')) return 'image';
      if (mimeType.startsWith('video/')) return 'video';
      if (mimeType.startsWith('audio/')) return 'audio';
      if (mimeType.startsWith('model/')) return 'model';

      // For files with no MIME type or application/octet-stream, check extension
      if (!mimeType || mimeType === 'application/octet-stream') {
        const ext = fileName.split('.').pop()?.toLowerCase();
        // 3D file extensions
        if (['gltf', 'glb', 'obj', 'stl', 'fbx', 'dae', 'blend'].includes(ext || '')) {
          return 'model';
        }
        // Document extensions
        if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext || '')) {
          return 'document';
        }
      }

      // Check for document MIME types
      if (
        mimeType.startsWith('application/pdf') ||
        mimeType.includes('document') ||
        mimeType.includes('sheet') ||
        mimeType.includes('presentation') ||
        mimeType === 'text/plain'
      ) {
        return 'document';
      }

      return 'other';
    };

    // Use database file_type for old file (more reliable than deriving from MIME type)
    const oldFileCategory = getFileCategoryFromDbType(loaderData.file_type);
    const newFileCategory = getNewFileCategory(file.type, file.name);

    // Only allow editing with the same file type category
    if (oldFileCategory !== newFileCategory) {
      toast.error(
        `Cannot change file type. Original file is ${oldFileCategory}, new file is ${newFileCategory}. Please upload a ${oldFileCategory} file.`,
      );
      return;
    }

    const validation = validateFile(file, {
      maxSizeMB: 100,
      allowedTypes: [
        'image/*',
        'audio/*',
        'video/*',
        'model/*',
        // 3D file formats
        'model/gltf+json', // .gltf
        'model/gltf-binary', // .glb
        'model/obj', // .obj
        'model/stl', // .stl
        'model/fbx', // .fbx
        'model/vnd.collada+xml', // .dae (Collada)
        'application/x-blender', // .blend
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/octet-stream',
      ],
      // Allow these extensions even if browser doesn't recognize MIME type
      allowedExtensions: [
        // 3D formats
        'gltf',
        'glb',
        'obj',
        'stl',
        'fbx',
        'dae',
        'blend',
        // Documents
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'ppt',
        'pptx',
        'txt',
      ],
    });

    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Prepare edit - get signed parameters from server
      const prepareData = new FormData();
      prepareData.append('fileId', params.fileId);
      prepareData.append('fileName', file.name);
      prepareData.append('mimeType', file.type);
      prepareData.append('size', file.size.toString());

      const prepareResponse = await fetch('/api/files/prepare-edit-upload', {
        method: 'POST',
        body: prepareData,
      });

      const prepareResult = await prepareResponse.json();

      if (!prepareResponse.ok || !prepareResult?.success) {
        throw new Error(prepareResult?.message || 'Failed to prepare file edit');
      }

      const { uploadSignature } = prepareResult.data;

      // 2. Upload directly to Cloudinary (replaces old file at same path)
      const cloudinaryResponse = await uploadToCloudinaryDirect(file, uploadSignature, {
        onProgress: (progress) => {
          setUploadProgress(progress.percentage);
        },
      });

      // 3. Confirm edit with server - updates database with cache busting
      const confirmData = new FormData();
      confirmData.append('fileId', params.fileId);
      confirmData.append('fileName', file.name);
      confirmData.append('cloudinaryPublicId', cloudinaryResponse.public_id);
      confirmData.append('size', cloudinaryResponse.bytes.toString());
      confirmData.append('mimeType', file.type);

      const confirmResponse = await fetch('/api/files/confirm-edit-upload', {
        method: 'POST',
        body: confirmData,
      });

      const confirmResult = await confirmResponse.json();

      if (!confirmResponse.ok || !confirmResult?.success) {
        throw new Error(confirmResult?.message || 'Failed to confirm file edit');
      }

      toast.success('File updated successfully!');
      setIsRedirecting(true);

      // Add cache buster to force reload
      const cacheBuster = Date.now();
      requestAnimationFrame(() => {
        navigate(
          `/${params.organizationId}/courses/${params.courseId}/file-library/${params.fileId}/edit?_=${cacheBuster}`,
        );
      });
    } catch (error) {
      console.error('File edit failed:', error);
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
          title='Update File'
          closeRoute={`/${params.organizationId}/courses/${params.courseId}/file-library/${params.fileId}/edit`}
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
                <p className='text-muted-foreground text-sm'>Finalizing update…</p>
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
                      labelProps={{ children: 'Upload file', required: true }}
                      inputProps={{ disabled: isDisabled }}
                      description='Upload a new file to replace the current one.'
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
                      disabled={isDisabled || !methods.formState.isDirty}
                      isLoading={isDisabled}
                      className='mt-4'
                    >
                      {isUploading ? 'Uploading...' : 'Save'}
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

import { generatePublicId, generateUploadSignature } from '@gonasi/cloudinary';
import { checkStorageLimitForOrg } from '@gonasi/database/files';
import { FileType, getFileExtension, getFileType } from '@gonasi/schemas/file';

import type { Route } from './+types/prepare-edit-upload';

import { createClient } from '~/lib/supabase/supabase.server';

/**
 * Prepares for editing a file by generating a signed Cloudinary upload URL.
 * The new file will replace the old one at the same path.
 *
 * Flow:
 * 1. Client calls this endpoint with file metadata
 * 2. Server validates permissions and generates signed upload parameters
 * 3. Client uses signature to upload directly to Cloudinary
 * 4. Client calls confirm-edit-upload to finalize the database update
 */
export async function action({ request }: Route.ActionArgs) {
  try {
    const { supabase } = createClient(request);
    const formData = await request.formData();

    const fileId = formData.get('fileId') as string;
    const fileName = formData.get('fileName') as string;
    const mimeType = formData.get('mimeType') as string;
    const sizeStr = formData.get('size') as string;
    const size = sizeStr ? parseInt(sizeStr, 10) : 0;

    console.log('[prepare-edit-upload] Request params:', {
      fileId,
      fileName,
      mimeType,
      size,
    });

    // Note: mimeType can be empty string for files like .fbx, so we check for undefined/null instead
    if (!fileId || !fileName || mimeType === undefined || mimeType === null || !size) {
      console.error('[prepare-edit-upload] Missing required fields:', {
        fileId: !!fileId,
        fileName: !!fileName,
        mimeType: mimeType !== undefined && mimeType !== null,
        size: !!size,
      });
      return Response.json(
        {
          success: false,
          message: 'Missing required fields: fileId, fileName, mimeType, size',
        },
        { status: 400 },
      );
    }

    // Fetch existing file record
    const { data: existingFile, error: fetchError } = await supabase
      .from('file_library')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fetchError || !existingFile) {
      console.error('[prepare-edit-upload] File not found:', fetchError);
      return Response.json(
        {
          success: false,
          message: 'File not found',
        },
        { status: 404 },
      );
    }

    // Check if user has permission to edit course
    const { data: canEdit, error: permError } = await supabase.rpc('can_user_edit_course', {
      arg_course_id: existingFile.course_id,
    });

    if (permError) {
      console.error('[prepare-edit-upload] Permission check error:', permError);
      return Response.json(
        {
          success: false,
          message: `Permission check failed: ${permError.message}`,
        },
        { status: 500 },
      );
    }

    if (!canEdit) {
      console.error('[prepare-edit-upload] Permission denied for user');
      return Response.json(
        {
          success: false,
          message: 'You do not have permission to edit this file',
        },
        { status: 403 },
      );
    }

    // Check storage quota if new file is larger than old file
    const sizeDifference = size - existingFile.size;

    if (sizeDifference > 0) {
      console.log('[prepare-edit-upload] New file is larger, checking storage quota...', {
        oldSize: existingFile.size,
        newSize: size,
        difference: sizeDifference,
      });

      const { success: hasSpaceSuccess, data: hasSpaceData } = await checkStorageLimitForOrg({
        supabase,
        organizationId: existingFile.organization_id,
        newFileSize: sizeDifference, // Only check the additional size needed
      });

      if (!hasSpaceSuccess) {
        const additionalMB = (sizeDifference / 1024 / 1024).toFixed(2);
        const remainingMB =
          hasSpaceData?.remaining_bytes != null
            ? (hasSpaceData.remaining_bytes / 1024 / 1024).toFixed(2)
            : null;

        const message = remainingMB
          ? `Cannot upload ${additionalMB} MB larger file: this would exceed your storage limit. You have ${remainingMB} MB remaining.`
          : `Cannot upload larger file: this would exceed your organization's storage limit.`;

        console.error('[prepare-edit-upload] Storage limit exceeded:', message);
        return Response.json(
          {
            success: false,
            message,
          },
          { status: 400 },
        );
      }

      console.log('[prepare-edit-upload] Storage check passed');
    } else {
      console.log('[prepare-edit-upload] New file is same size or smaller, skipping storage check');
    }

    // Use the SAME public_id (path) to replace the file
    const publicId = existingFile.path;

    // Determine file type and resource type from MIME type or fileName
    const file_type = (() => {
      if (mimeType.startsWith('image/')) return FileType.IMAGE;
      if (mimeType.startsWith('video/')) return FileType.VIDEO;
      if (mimeType.startsWith('audio/')) return FileType.AUDIO;
      if (mimeType.startsWith('model/')) return FileType.MODEL_3D;
      // For files with no MIME type or application/octet-stream, detect from extension
      const extension = getFileExtension(fileName);
      return getFileType(extension);
    })();

    const resourceType =
      file_type === FileType.VIDEO
        ? 'video'
        : file_type === FileType.IMAGE
          ? 'image'
          : 'raw'; // 3D models, audio, documents all use 'raw'

    // Generate signed upload parameters
    console.log('[prepare-edit-upload] Generating signature...');
    const uploadSignature = generateUploadSignature({
      publicId,
      resourceType,
      tags: ['draft', 'file-library', existingFile.course_id, existingFile.organization_id],
      context: {
        organizationId: existingFile.organization_id,
        courseId: existingFile.course_id,
        fileType: file_type,
      },
      maxFileSize: size * 1.1, // Allow 10% buffer for encoding
    });

    console.log('[prepare-edit-upload] Signature generated successfully');
    return Response.json({
      success: true,
      data: {
        uploadSignature,
        oldPath: existingFile.path,
      },
    });
  } catch (error) {
    console.error('[prepare-edit-upload] Unexpected error:', error);
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to prepare file edit',
      },
      { status: 500 },
    );
  }
}

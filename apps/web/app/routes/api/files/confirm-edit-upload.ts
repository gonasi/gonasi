import { FileType, getFileType } from '@gonasi/schemas/file';

import type { Route } from './+types/confirm-edit-upload';

import { getUserId } from '@gonasi/database/auth';
import { createClient } from '~/lib/supabase/supabase.server';

/**
 * Confirms a file edit after client-side direct upload to Cloudinary completes.
 * Updates the database with new file metadata and cache-busting timestamp.
 *
 * NOTE: Frontend enforces same file type (image→image, video→video, etc.)
 * so Cloudinary overwrites at the same path with same resource type.
 *
 * Flow:
 * 1. Client calls prepare-edit-upload to get signed parameters
 * 2. Client uploads directly to Cloudinary (overwrites old file)
 * 3. Cloudinary returns upload response
 * 4. Client calls THIS endpoint with Cloudinary response data
 * 5. We update the database with new metadata and cache-busting timestamp
 */
export async function action({ request }: Route.ActionArgs) {
  try {
    const { supabase } = createClient(request);
    const userId = await getUserId(supabase);
    const formData = await request.formData();

    const fileId = formData.get('fileId') as string;
    const fileName = formData.get('fileName') as string;
    const cloudinaryPublicId = formData.get('cloudinaryPublicId') as string;
    const size = Number(formData.get('size'));
    const mimeType = formData.get('mimeType') as string;

    console.log('[confirm-edit-upload] Request params:', {
      fileId,
      fileName,
      cloudinaryPublicId,
      size,
      mimeType,
    });

    // Note: mimeType can be empty string for files like .fbx, so we check for undefined/null instead
    if (!fileId || !fileName || !cloudinaryPublicId || !size || mimeType === undefined || mimeType === null) {
      console.error('[confirm-edit-upload] Missing required fields:', {
        fileId: !!fileId,
        fileName: !!fileName,
        cloudinaryPublicId: !!cloudinaryPublicId,
        size: !!size,
        mimeType: mimeType !== undefined && mimeType !== null,
      });
      return Response.json(
        {
          success: false,
          message: 'Missing required fields',
        },
        { status: 400 },
      );
    }

    // Fetch existing file to validate file type hasn't changed
    const { data: existingFile, error: fetchError } = await supabase
      .from('file_library')
      .select('file_type, mime_type')
      .eq('id', fileId)
      .single();

    if (fetchError || !existingFile) {
      console.error('[confirm-edit-upload] File not found:', fetchError);
      return Response.json(
        {
          success: false,
          message: 'File not found',
        },
        { status: 404 },
      );
    }

    // Extract extension from actual filename (fileName contains the real extension like .fbx)
    const extractedExt = fileName.split('.').pop()?.toLowerCase() || '';

    // For mime types like "image/svg+xml", also extract from mime as fallback
    const mimeSubtype = mimeType.split('/')[1] || 'bin';
    const mimeExt = mimeSubtype.split('+')[0]; // Handle "svg+xml" -> "svg"

    // Use extracted extension from filename, fallback to mime-based extension
    const extension = extractedExt || mimeExt;

    // Determine new file type from MIME type or extension
    const new_file_type = (() => {
      if (mimeType.startsWith('image/')) return FileType.IMAGE;
      if (mimeType.startsWith('video/')) return FileType.VIDEO;
      if (mimeType.startsWith('audio/')) return FileType.AUDIO;
      if (mimeType.startsWith('model/')) return FileType.MODEL_3D;
      // For files with no MIME type or application/octet-stream, detect from extension
      return getFileType(extension);
    })();

    // CRITICAL: Enforce same file type category (image→image, video→video, etc.)
    if (existingFile.file_type !== new_file_type) {
      console.error('[confirm-edit-upload] File type mismatch:', {
        old_type: existingFile.file_type,
        new_type: new_file_type,
      });
      return Response.json(
        {
          success: false,
          message: `File type mismatch. Cannot change from ${existingFile.file_type} to ${new_file_type}. Please upload a ${existingFile.file_type} file.`,
        },
        { status: 400 },
      );
    }

    console.log('[confirm-edit-upload] Updating file metadata...');

    // Update file record with new metadata and cache-busting timestamp
    const { error: updateError } = await supabase
      .from('file_library')
      .update({
        path: cloudinaryPublicId,
        size,
        mime_type: mimeType,
        extension,
        file_type: new_file_type, // Should be same as old, but update anyway
        updated_by: userId,
        updated_at: new Date().toISOString(), // CRITICAL: Cache busting
      })
      .eq('id', fileId);

    if (updateError) {
      console.error('[confirm-edit-upload] Database update error:', updateError);
      return Response.json(
        {
          success: false,
          message: `Database update failed: ${updateError.message}`,
        },
        { status: 500 },
      );
    }

    console.log('[confirm-edit-upload] File updated successfully');
    return Response.json({
      success: true,
      message: 'File updated successfully',
    });
  } catch (error) {
    console.error('[confirm-edit-upload] Unexpected error:', error);
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to confirm file edit',
      },
      { status: 500 },
    );
  }
}

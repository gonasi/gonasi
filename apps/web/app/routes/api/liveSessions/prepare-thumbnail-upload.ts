import { generatePublicId, generateUploadSignature } from '@gonasi/cloudinary';

import type { Route } from './+types/prepare-thumbnail-upload';

import { createClient } from '~/lib/supabase/supabase.server';

/**
 * Prepares a thumbnail upload for a live session by generating Cloudinary signature.
 * This is step 1 of 3 in the direct upload flow.
 */
export async function action({ request }: Route.ActionArgs) {
  try {
    const { supabase } = createClient(request);
    const formData = await request.formData();

    const sessionId = formData.get('sessionId') as string;
    const organizationId = formData.get('organizationId') as string;
    const mimeType = formData.get('mimeType') as string;
    const sizeStr = formData.get('size') as string;
    const size = sizeStr ? parseInt(sizeStr, 10) : 0;

    console.log('[prepare-thumbnail-upload] Request params:', {
      sessionId,
      organizationId,
      mimeType,
      size,
    });

    if (!sessionId || !organizationId || !mimeType || !size) {
      console.error('[prepare-thumbnail-upload] Missing required fields:', {
        sessionId: !!sessionId,
        organizationId: !!organizationId,
        mimeType: !!mimeType,
        size: !!size,
      });
      return Response.json(
        {
          success: false,
          message: 'Missing required fields: sessionId, organizationId, mimeType, size',
        },
        { status: 400 },
      );
    }

    // Check if user has permission to edit live session
    const { data: canEdit, error: permError } = await supabase.rpc('can_user_edit_live_session', {
      arg_session_id: sessionId,
    });

    if (permError) {
      console.error('[prepare-thumbnail-upload] Permission check error:', permError);
      return Response.json(
        {
          success: false,
          message: `Permission check failed: ${permError.message}`,
        },
        { status: 500 },
      );
    }

    if (!canEdit) {
      console.error('[prepare-thumbnail-upload] Permission denied for user');
      return Response.json(
        {
          success: false,
          message: 'You do not have permission to edit this live session',
        },
        { status: 403 },
      );
    }

    // Generate Cloudinary public_id for thumbnail
    // Pattern: /:organizationId/live-sessions/:sessionId/thumbnail/draft/thumbnail
    const publicId = generatePublicId({
      scope: 'draft',
      resourceType: 'thumbnail',
      organizationId,
      liveSessionId: sessionId,
    });

    console.log('[prepare-thumbnail-upload] Generating signature...');

    // Generate signed upload parameters
    // resourceType 'image' is the Cloudinary upload URL type (not the path resourceType)
    const uploadSignature = generateUploadSignature({
      publicId,
      resourceType: 'image', // Cloudinary resource type (image/video/raw)
      tags: ['draft', 'thumbnail', sessionId, organizationId, 'live-session'],
      context: {
        organizationId,
        sessionId,
        type: 'live-session',
      },
      maxFileSize: size * 1.1, // Allow 10% buffer for encoding
    });

    console.log('[prepare-thumbnail-upload] Signature generated successfully');
    return Response.json({
      success: true,
      data: {
        uploadSignature,
      },
    });
  } catch (error) {
    console.error('[prepare-thumbnail-upload] Unexpected error:', error);
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to prepare thumbnail upload',
      },
      { status: 500 },
    );
  }
}

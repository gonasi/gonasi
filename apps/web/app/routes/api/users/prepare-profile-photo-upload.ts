import { generateUploadSignature } from '@gonasi/cloudinary';

import type { Route } from './+types/prepare-profile-photo-upload';

import { createClient } from '~/lib/supabase/supabase.server';

/**
 * Prepares a user profile photo upload by generating Cloudinary signature.
 * This is step 1 of 3 in the direct upload flow.
 */
export async function action({ request }: Route.ActionArgs) {
  try {
    const { supabase } = createClient(request);
    const formData = await request.formData();

    const mimeType = formData.get('mimeType') as string;
    const sizeStr = formData.get('size') as string;
    const size = sizeStr ? parseInt(sizeStr, 10) : 0;

    console.log('[prepare-user-profile-photo-upload] Request params:', {
      mimeType,
      size,
    });

    if (!mimeType || !size) {
      console.error('[prepare-user-profile-photo-upload] Missing required fields:', {
        mimeType: !!mimeType,
        size: !!size,
      });
      return Response.json(
        {
          success: false,
          message: 'Missing required fields: mimeType, size',
        },
        { status: 400 },
      );
    }

    // Get authenticated user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user?.id) {
      return Response.json(
        {
          success: false,
          message: 'User not authenticated',
        },
        { status: 401 },
      );
    }

    const userId = userData.user.id;

    // Generate Cloudinary public_id for user profile photo
    // Pattern: /users/:userId/profile/avatar (consistent folder structure)
    const publicId = `users/${userId}/profile/avatar`;

    console.log('[prepare-user-profile-photo-upload] Generating signature...');

    // Generate signed upload parameters
    // resourceType 'image' is the Cloudinary upload URL type (not the path resourceType)
    const uploadSignature = generateUploadSignature({
      publicId,
      resourceType: 'image', // Cloudinary resource type (image/video/raw)
      tags: ['profile', 'avatar', userId],
      context: {
        userId,
      },
      maxFileSize: size * 1.1, // Allow 10% buffer for encoding
    });

    console.log('[prepare-user-profile-photo-upload] Signature generated successfully');
    return Response.json({
      success: true,
      data: {
        uploadSignature,
      },
    });
  } catch (error) {
    console.error('[prepare-user-profile-photo-upload] Unexpected error:', error);
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to prepare profile photo upload',
      },
      { status: 500 },
    );
  }
}

import { generateUploadSignature } from '@gonasi/cloudinary';

import type { Route } from './+types/prepare-banner-upload';

import { createClient } from '~/lib/supabase/supabase.server';

/**
 * Prepares an organization banner upload by generating Cloudinary signature.
 * This is step 1 of 3 in the direct upload flow.
 */
export async function action({ request }: Route.ActionArgs) {
  try {
    const { supabase } = createClient(request);
    const formData = await request.formData();

    const organizationId = formData.get('organizationId') as string;
    const mimeType = formData.get('mimeType') as string;
    const sizeStr = formData.get('size') as string;
    const size = sizeStr ? parseInt(sizeStr, 10) : 0;

    console.log('[prepare-banner-upload] Request params:', {
      organizationId,
      mimeType,
      size,
    });

    if (!organizationId || !mimeType || !size) {
      console.error('[prepare-banner-upload] Missing required fields:', {
        organizationId: !!organizationId,
        mimeType: !!mimeType,
        size: !!size,
      });
      return Response.json(
        {
          success: false,
          message: 'Missing required fields: organizationId, mimeType, size',
        },
        { status: 400 },
      );
    }

    // Check if user has permission to edit organization (owner or admin)
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

    const { data: canEdit, error: permError } = await supabase.rpc('has_org_role', {
      arg_org_id: organizationId,
      required_role: 'admin',
      arg_user_id: userData.user.id,
    });

    if (permError) {
      console.error('[prepare-banner-upload] Permission check error:', permError);
      return Response.json(
        {
          success: false,
          message: `Permission check failed: ${permError.message}`,
        },
        { status: 500 },
      );
    }

    if (!canEdit) {
      console.error('[prepare-banner-upload] Permission denied for user');
      return Response.json(
        {
          success: false,
          message: 'You do not have permission to edit this organization',
        },
        { status: 403 },
      );
    }

    // Generate Cloudinary public_id for organization banner
    // Pattern: /organizations/:organizationId/profile/banner (consistent folder structure)
    const publicId = `organizations/${organizationId}/profile/banner`;

    console.log('[prepare-banner-upload] Generating signature...');

    // Generate signed upload parameters
    // resourceType 'image' is the Cloudinary upload URL type (not the path resourceType)
    const uploadSignature = generateUploadSignature({
      publicId,
      resourceType: 'image', // Cloudinary resource type (image/video/raw)
      tags: ['profile', 'banner', organizationId],
      context: {
        organizationId,
      },
      maxFileSize: size * 1.1, // Allow 10% buffer for encoding
    });

    console.log('[prepare-banner-upload] Signature generated successfully');
    return Response.json({
      success: true,
      data: {
        uploadSignature,
      },
    });
  } catch (error) {
    console.error('[prepare-banner-upload] Unexpected error:', error);
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to prepare banner upload',
      },
      { status: 500 },
    );
  }
}

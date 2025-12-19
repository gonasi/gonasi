import type { Route } from './+types/confirm-banner-upload';

import { createClient } from '~/lib/supabase/supabase.server';

/**
 * Confirms an organization banner upload after successful Cloudinary upload.
 * This is step 3 of 3 in the direct upload flow.
 * Updates the organization's banner_url in the database.
 */
export async function action({ request }: Route.ActionArgs) {
  try {
    const { supabase } = createClient(request);
    const formData = await request.formData();

    const organizationId = formData.get('organizationId') as string;
    const cloudinaryPublicId = formData.get('cloudinaryPublicId') as string;

    console.log('[confirm-banner-upload] Request params:', {
      organizationId,
      cloudinaryPublicId,
    });

    if (!organizationId || !cloudinaryPublicId) {
      console.error('[confirm-banner-upload] Missing required fields:', {
        organizationId: !!organizationId,
        cloudinaryPublicId: !!cloudinaryPublicId,
      });
      return Response.json(
        {
          success: false,
          message: 'Missing required fields: organizationId, cloudinaryPublicId',
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
      console.error('[confirm-banner-upload] Permission check error:', permError);
      return Response.json(
        {
          success: false,
          message: `Permission check failed: ${permError.message}`,
        },
        { status: 500 },
      );
    }

    if (!canEdit) {
      console.error('[confirm-banner-upload] Permission denied for user');
      return Response.json(
        {
          success: false,
          message: 'You do not have permission to edit this organization',
        },
        { status: 403 },
      );
    }

    console.log('[confirm-banner-upload] Updating organization banner in database...');

    // Update organization banner in database
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        banner_url: cloudinaryPublicId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    if (updateError) {
      console.error('[confirm-banner-upload] Database update error:', updateError);
      return Response.json(
        {
          success: false,
          message: `Database update failed: ${updateError.message}`,
        },
        { status: 500 },
      );
    }

    console.log('[confirm-banner-upload] Banner updated successfully');
    return Response.json({
      success: true,
      message: 'Banner updated successfully',
    });
  } catch (error) {
    console.error('[confirm-banner-upload] Unexpected error:', error);
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to confirm banner upload',
      },
      { status: 500 },
    );
  }
}

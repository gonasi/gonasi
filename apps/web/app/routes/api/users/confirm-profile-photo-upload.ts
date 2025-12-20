import type { Route } from './+types/confirm-profile-photo-upload';

import { createClient } from '~/lib/supabase/supabase.server';

/**
 * Confirms a user profile photo upload after successful Cloudinary upload.
 * This is step 3 of 3 in the direct upload flow.
 * Updates the user's avatar_url in the database.
 */
export async function action({ request }: Route.ActionArgs) {
  try {
    const { supabase } = createClient(request);
    const formData = await request.formData();

    const cloudinaryPublicId = formData.get('cloudinaryPublicId') as string;

    console.log('[confirm-user-profile-photo-upload] Request params:', {
      cloudinaryPublicId,
    });

    if (!cloudinaryPublicId) {
      console.error('[confirm-user-profile-photo-upload] Missing required fields:', {
        cloudinaryPublicId: !!cloudinaryPublicId,
      });
      return Response.json(
        {
          success: false,
          message: 'Missing required field: cloudinaryPublicId',
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

    console.log('[confirm-user-profile-photo-upload] Updating user avatar in database...');

    // Update user avatar in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: cloudinaryPublicId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[confirm-user-profile-photo-upload] Database update error:', updateError);
      return Response.json(
        {
          success: false,
          message: `Database update failed: ${updateError.message}`,
        },
        { status: 500 },
      );
    }

    console.log('[confirm-user-profile-photo-upload] Profile photo updated successfully');
    return Response.json({
      success: true,
      message: 'Profile photo updated successfully',
    });
  } catch (error) {
    console.error('[confirm-user-profile-photo-upload] Unexpected error:', error);
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to confirm profile photo upload',
      },
      { status: 500 },
    );
  }
}

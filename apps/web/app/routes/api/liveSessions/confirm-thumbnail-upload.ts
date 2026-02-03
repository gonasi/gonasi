import type { Route } from './+types/confirm-thumbnail-upload';

import { createClient } from '~/lib/supabase/supabase.server';

/**
 * Confirms a thumbnail upload after successful Cloudinary upload.
 * This is step 3 of 3 in the direct upload flow.
 * Updates the live session's image_url in the database.
 */
export async function action({ request }: Route.ActionArgs) {
  try {
    const { supabase } = createClient(request);
    const formData = await request.formData();

    const sessionId = formData.get('sessionId') as string;
    const cloudinaryPublicId = formData.get('cloudinaryPublicId') as string;

    console.log('[confirm-thumbnail-upload] Request params:', {
      sessionId,
      cloudinaryPublicId,
    });

    if (!sessionId || !cloudinaryPublicId) {
      console.error('[confirm-thumbnail-upload] Missing required fields:', {
        sessionId: !!sessionId,
        cloudinaryPublicId: !!cloudinaryPublicId,
      });
      return Response.json(
        {
          success: false,
          message: 'Missing required fields: sessionId, cloudinaryPublicId',
        },
        { status: 400 },
      );
    }

    // Check if user has permission to edit live session
    const { data: canEdit, error: permError } = await supabase.rpc('can_user_edit_live_session', {
      arg_session_id: sessionId,
    });

    if (permError) {
      console.error('[confirm-thumbnail-upload] Permission check error:', permError);
      return Response.json(
        {
          success: false,
          message: `Permission check failed: ${permError.message}`,
        },
        { status: 500 },
      );
    }

    if (!canEdit) {
      console.error('[confirm-thumbnail-upload] Permission denied for user');
      return Response.json(
        {
          success: false,
          message: 'You do not have permission to edit this live session',
        },
        { status: 403 },
      );
    }

    console.log('[confirm-thumbnail-upload] Updating live session thumbnail in database...');

    // Update live session thumbnail in database
    const { error: updateError } = await supabase
      .from('live_sessions')
      .update({
        image_url: cloudinaryPublicId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('[confirm-thumbnail-upload] Database update error:', updateError);
      return Response.json(
        {
          success: false,
          message: `Database update failed: ${updateError.message}`,
        },
        { status: 500 },
      );
    }

    console.log('[confirm-thumbnail-upload] Thumbnail updated successfully');
    return Response.json({
      success: true,
      message: 'Thumbnail updated successfully',
    });
  } catch (error) {
    console.error('[confirm-thumbnail-upload] Unexpected error:', error);
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to confirm thumbnail upload',
      },
      { status: 500 },
    );
  }
}

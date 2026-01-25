import type { RevokeCourseInviteSchemaTypes } from '@gonasi/schemas/courseInvites';

import type { TypedSupabaseClient } from '../client';

interface RevokeCourseInviteParams {
  supabase: TypedSupabaseClient;
  data: RevokeCourseInviteSchemaTypes;
}

export const revokeCourseInvite = async ({ supabase, data }: RevokeCourseInviteParams) => {
  const { publishedCourseId, token } = data;

  try {
    // 1. Fetch the invite to verify it exists and hasn't been accepted
    const { data: invite, error: fetchError } = await supabase
      .from('course_invites')
      .select('id, email, accepted_at, revoked_at')
      .eq('published_course_id', publishedCourseId)
      .eq('token', token)
      .single();

    if (fetchError || !invite) {
      console.error('[revokeCourseInvite] Invite fetch failed:', fetchError);
      return {
        success: false,
        message: 'Invite not found.',
        data: null,
      };
    }

    // 2. Check if already accepted
    if (invite.accepted_at) {
      return {
        success: false,
        message: 'Cannot revoke an invite that has already been accepted.',
        data: null,
      };
    }

    // 3. Check if already revoked
    if (invite.revoked_at) {
      return {
        success: false,
        message: 'This invite has already been revoked.',
        data: null,
      };
    }

    // 4. Revoke the invite
    const { error: updateError } = await supabase
      .from('course_invites')
      .update({
        revoked_at: new Date().toISOString(),
      })
      .eq('published_course_id', publishedCourseId)
      .eq('token', token);

    if (updateError) {
      console.error('[revokeCourseInvite] Update failed:', updateError);
      return {
        success: false,
        message: 'Failed to revoke invite. Please try again.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Invite revoked successfully.',
      data: null,
    };
  } catch (err) {
    console.error('[revokeCourseInvite] Unexpected error:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
      data: null,
    };
  }
};

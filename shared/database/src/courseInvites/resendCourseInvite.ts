import type { ResendCourseInviteSchemaTypes } from '@gonasi/schemas/courseInvites';

import type { TypedSupabaseClient } from '../client';

interface ResendCourseInviteParams {
  supabase: TypedSupabaseClient;
  data: ResendCourseInviteSchemaTypes;
}

export const resendCourseInvite = async ({ supabase, data }: ResendCourseInviteParams) => {
  const { publishedCourseId, token } = data;

  try {
    // 1. Fetch only relevant fields from the invite
    const { data: invite, error: fetchError } = await supabase
      .from('course_invites')
      .select('email, accepted_at, resend_count, last_sent_at, token')
      .eq('published_course_id', publishedCourseId)
      .eq('token', token)
      .single();

    if (fetchError || !invite) {
      console.error('[resendCourseInvite] Invite fetch failed:', fetchError);
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
        message: 'This invite has already been accepted.',
        data: null,
      };
    }

    // 3. Enforce 5-minute resend interval (matching our guard function)
    const lastSentAt = new Date(invite.last_sent_at);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;

    if (now.getTime() - lastSentAt.getTime() < fiveMinutes) {
      return {
        success: false,
        message: 'You can only resend an invite every 5 minutes.',
        data: null,
      };
    }

    // 4. Update resend count and last_sent_at
    const { error: updateError } = await supabase
      .from('course_invites')
      .update({
        resend_count: invite.resend_count + 1,
        last_sent_at: now.toISOString(),
      })
      .eq('published_course_id', publishedCourseId)
      .eq('token', token);

    if (updateError) {
      console.error('[resendCourseInvite] Update failed:', updateError);
      return {
        success: false,
        message: 'Failed to update invite. Please try again.',
        data: null,
      };
    }

    const { error: invokeError } = await supabase.functions.invoke('send-course-invite', {
      body: {
        email: invite.email,
        token: invite.token,
      },
    });

    if (invokeError) {
      console.error('[resendCourseInvite] Email resend failed:', invokeError);
      return {
        success: false,
        message: 'Failed to resend invite email.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Invite email resent successfully.',
      data: null,
    };
  } catch (err) {
    console.error('[resendCourseInvite] Unexpected error:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
      data: null,
    };
  }
};

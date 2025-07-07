import type { ResendInviteToOrganizationEmailSchemaTypes } from '@gonasi/schemas/organizations';

import type { TypedSupabaseClient } from '../../client';

interface ResendOrganizationInviteParams {
  supabase: TypedSupabaseClient;
  data: ResendInviteToOrganizationEmailSchemaTypes;
}

export const resendOrganizationInvite = async ({
  supabase,
  data,
}: ResendOrganizationInviteParams) => {
  const { organizationId, token } = data;

  try {
    // 1. Fetch only relevant fields from the invite
    const { data: invite, error: fetchError } = await supabase
      .from('organization_invites')
      .select('email, accepted_at, resend_count, last_sent_at, token')
      .eq('organization_id', organizationId)
      .eq('token', token)
      .single();

    if (fetchError || !invite) {
      console.error('[resendOrganizationInvite] Invite fetch failed:', fetchError);
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

    // 3. Enforce 10-minute resend interval
    const lastSentAt = new Date(invite.last_sent_at);
    const now = new Date();
    const tenMinutes = 10 * 60 * 1000;

    if (now.getTime() - lastSentAt.getTime() < tenMinutes) {
      return {
        success: false,
        message: 'You can only resend an invite every 10 minutes.',
        data: null,
      };
    }

    // 4. Update resend count and last_sent_at
    const { error: updateError } = await supabase
      .from('organization_invites')
      .update({
        resend_count: invite.resend_count + 1,
        last_sent_at: now.toISOString(),
      })
      .eq('organization_id', organizationId)
      .eq('token', token);

    if (updateError) {
      console.error('[resendOrganizationInvite] Update failed:', updateError);
      return {
        success: false,
        message: 'Failed to update invite. Please try again.',
        data: null,
      };
    }

    // 5. Re-send the invite email
    const { error: invokeError } = await supabase.functions.invoke('send-org-invite', {
      body: {
        email: invite.email,
        token: invite.token,
      },
    });

    if (invokeError) {
      console.error('[resendOrganizationInvite] Email resend failed:', invokeError);
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
    console.error('[resendOrganizationInvite] Unexpected error:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
      data: null,
    };
  }
};

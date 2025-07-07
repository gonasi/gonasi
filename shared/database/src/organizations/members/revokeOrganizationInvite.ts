import type { RevokeInviteToOrganizationSchemaTypes } from '@gonasi/schemas/organizations';

import type { TypedSupabaseClient } from '../../client';

interface RevokeOrganizationInviteParams {
  supabase: TypedSupabaseClient;
  data: RevokeInviteToOrganizationSchemaTypes;
}

export const revokeOrganizationInvite = async ({
  supabase,
  data,
}: RevokeOrganizationInviteParams) => {
  const { organizationId, token } = data;

  try {
    // 1. Fetch the invite
    const { data: invite, error: fetchError } = await supabase
      .from('organization_invites')
      .select('email, accepted_at, revoked_at, token')
      .eq('organization_id', organizationId)
      .eq('token', token)
      .single();

    if (fetchError || !invite) {
      console.error('[revokeOrganizationInvite] Invite fetch failed:', fetchError);
      return {
        success: false,
        message: 'Invite not found.',
        data: null,
      };
    }

    // 2. Prevent revoking accepted or already revoked invites
    if (invite.accepted_at) {
      return {
        success: false,
        message: 'This invite has already been accepted.',
        data: null,
      };
    }

    if (invite.revoked_at) {
      return {
        success: false,
        message: 'This invite has already been revoked.',
        data: null,
      };
    }

    // 3. Revoke the invite by setting revoked_at
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('organization_invites')
      .update({ revoked_at: now })
      .eq('organization_id', organizationId)
      .eq('token', token);

    if (updateError) {
      console.error('[revokeOrganizationInvite] Update failed:', updateError);
      return {
        success: false,
        message: 'Failed to revoke invite. Please try again.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Invite successfully revoked.',
      data: null,
    };
  } catch (err) {
    console.error('[revokeOrganizationInvite] Unexpected error:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
      data: null,
    };
  }
};

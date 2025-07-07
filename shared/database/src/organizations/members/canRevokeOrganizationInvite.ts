import type { TypedSupabaseClient } from '../../client';

interface CanRevokeParams {
  supabase: TypedSupabaseClient;
  organizationId: string;
  token: string;
}

export const canRevokeOrganizationInvite = async ({
  supabase,
  organizationId,
  token,
}: CanRevokeParams): Promise<{
  canRevoke: boolean;
  reason: string | null;
  invite: { email: string; token: string } | null;
}> => {
  // Fetch only the fields we need
  const { data: invite, error } = await supabase
    .from('organization_invites')
    .select('email, accepted_at, revoked_at, expires_at, token')
    .eq('organization_id', organizationId)
    .eq('token', token)
    .single();

  if (error || !invite) {
    return {
      canRevoke: false,
      reason: 'Invite not found.',
      invite: null,
    };
  }

  if (invite.accepted_at) {
    return {
      canRevoke: false,
      reason: 'Invite has already been accepted.',
      invite: null,
    };
  }

  if (invite.revoked_at) {
    return {
      canRevoke: false,
      reason: 'Invite has already been revoked.',
      invite: null,
    };
  }

  const now = new Date();
  const expiresAt = new Date(invite.expires_at);
  if (now > expiresAt) {
    return {
      canRevoke: false,
      reason: 'Invite has already expired.',
      invite: null,
    };
  }

  return {
    canRevoke: true,
    reason: null,
    invite: {
      email: invite.email,
      token: invite.token,
    },
  };
};

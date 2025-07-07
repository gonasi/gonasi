import type { TypedSupabaseClient } from '../../client';

interface CanResendParams {
  supabase: TypedSupabaseClient;
  organizationId: string;
  token: string;
}

export const canResendOrganizationInvite = async ({
  supabase,
  organizationId,
  token,
}: CanResendParams): Promise<{
  canResend: boolean;
  reason: string | null;
  invite: { email: string; token: string } | null;
}> => {
  // Fetch only the fields we care about
  const { data: invite, error } = await supabase
    .from('organization_invites')
    .select('email, accepted_at, last_sent_at, token')
    .eq('organization_id', organizationId)
    .eq('token', token)
    .single();

  if (error || !invite) {
    return {
      canResend: false,
      reason: 'Invite not found.',
      invite: null,
    };
  }

  if (invite.accepted_at) {
    return {
      canResend: false,
      reason: 'Invite has already been accepted.',
      invite: null,
    };
  }

  const lastSentAt = new Date(invite.last_sent_at);
  const now = new Date();
  const TEN_MINUTES_MS = 10 * 60 * 1000;

  if (now.getTime() - lastSentAt.getTime() < TEN_MINUTES_MS) {
    return {
      canResend: false,
      reason: 'You can only resend an invite every 10 minutes.',
      invite: null,
    };
  }

  return {
    canResend: true,
    reason: null,
    invite: {
      email: invite.email,
      token: invite.token,
    },
  };
};

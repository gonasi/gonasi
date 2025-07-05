import type { TypedSupabaseClient } from '../../client';

interface FetchOrganizationInvitesArgs {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

export async function fetchOrganizationInvites({
  supabase,
  organizationId,
}: FetchOrganizationInvitesArgs) {
  try {
    const { data, error } = await supabase
      .from('organization_invites')
      .select(
        'id, email, role, accepted_at, accepted_by, revoked_at, created_at, last_sent_at, expires_at',
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[fetchOrganizationInvites] Supabase error:', error.message);
      return null;
    }

    return data ?? null;
  } catch (err) {
    console.error('[fetchOrganizationInvites] Unexpected error:', err);
    return null;
  }
}

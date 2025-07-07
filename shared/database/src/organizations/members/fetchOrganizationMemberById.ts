import type { TypedSupabaseClient } from '../../client';

interface FetchOrganizationMemberArgs {
  supabase: TypedSupabaseClient;
  memberId: string;
}

export async function fetchOrganizationMemberById({
  supabase,
  memberId,
}: FetchOrganizationMemberArgs) {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('id, organization_id, user_id, role')
      .eq('id', memberId)
      .single();

    if (error) {
      console.error('[fetchOrganizationMemberById] Supabase error:', error.message);
      return null;
    }

    return data ?? null;
  } catch (err) {
    console.error('[fetchOrganizationMemberById] Unexpected error:', err);
    return null;
  }
}

import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

interface MemberProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  blur_hash: string | null;
  phone_number: string | null;
  country_code: string | null;
  active_organization_id: string | null;
}

interface InviterProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  blur_hash: string | null;
}

interface OrganizationMember {
  user: MemberProfile;
  invited_by: InviterProfile | null;
  membership_id: string;
  organization_id: string;
  role: 'owner' | 'admin' | 'editor';
  membership_created_at: string;
  membership_updated_at: string;
}

interface FetchOrganizationMembersArgs {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

export async function fetchOrganizationMembers({
  supabase,
  organizationId,
}: FetchOrganizationMembersArgs): Promise<OrganizationMember[] | null> {
  try {
    const userId = await getUserId(supabase);
    if (!userId) throw new Error('User ID not found');

    const { data, error } = await supabase.rpc('get_active_organization_members', {
      _organization_id: organizationId,
      _user_id: userId,
    });

    if (error) throw new Error(error.message);

    // Manually cast the JSONB result
    return (data as unknown as OrganizationMember[]) ?? [];
  } catch (err) {
    console.error('[fetchOrganizationMembers] Error:', err);
    return null;
  }
}

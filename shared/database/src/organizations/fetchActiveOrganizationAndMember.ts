import type { Organization, OrganizationMember } from '@gonasi/schemas/organizations';

import type { TypedSupabaseClient } from '../client';
import { getUserProfile } from '../profile';

export interface ActiveOrganizationWithMembership {
  organization: Organization;
  member: OrganizationMember | null;
}

/**
 * Fetches the currently active organization for the logged-in user,
 * returning both the organization and their membership info.
 */
export async function fetchActiveOrganizationAndMember(
  supabase: TypedSupabaseClient,
): Promise<ActiveOrganizationWithMembership | null> {
  try {
    const { user } = await getUserProfile(supabase);
    const activeOrgId = user?.active_organization_id;

    if (!activeOrgId || !user?.id) return null;

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', activeOrgId)
      .single();

    if (orgError || !organization) {
      console.error('Failed to fetch organization:', orgError);
      return null;
    }

    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', activeOrgId)
      .eq('user_id', user.id)
      .single();

    if (memberError) {
      console.warn('Organization member record not found:', memberError);
    }

    return {
      organization,
      member: member ?? null,
    };
  } catch (err) {
    console.error('fetchActiveOrganizationAndMember error:', err);
    return null;
  }
}

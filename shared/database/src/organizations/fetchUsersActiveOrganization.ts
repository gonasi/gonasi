import type { Organization } from '@gonasi/schemas/organizations';

import type { TypedSupabaseClient } from '../client';
import { getUserProfile } from '../profile';

/**
 * Fetches the currently active organization for the logged-in user.
 * Returns basic organization info including ID, name, handle, and avatar metadata.
 */
export async function fetchUsersActiveOrganization(
  supabase: TypedSupabaseClient,
): Promise<Organization | null> {
  try {
    const { user } = await getUserProfile(supabase);
    const activeOrgId = user?.active_organization_id;

    if (!activeOrgId) return null;

    const { data, error } = await supabase
      .from('organizations')
      .select()
      .eq('id', activeOrgId)
      .single();

    if (error) {
      console.error('Failed to fetch active organization:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('fetchUsersActiveOrganization error:', err);
    return null;
  }
}

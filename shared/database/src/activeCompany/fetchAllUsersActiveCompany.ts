import type { TypedSupabaseClient } from '../client';

interface UserActiveCompany {
  id: string;
  user_id: string;
  company_id: string;
  staff_role: 'user' | 'su' | 'admin';
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

/**
 * Fetches the active company of the current user along with their profile and staff role.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @returns {Promise<UserActiveCompany | null>} - The user's active company data with profile and staff role, or null if not found.
 */
export async function fetchAllUsersActiveCompany(
  supabase: TypedSupabaseClient,
): Promise<UserActiveCompany | null> {
  const { data, error } = await supabase.rpc('get_user_active_company');

  if (error) {
    console.error('Error fetching active company:', error);
    return null;
  }

  if (!data) return null;

  // Explicitly type the data and validate its structure
  const activeCompany = data as Partial<UserActiveCompany>;

  if (
    activeCompany.id &&
    activeCompany.user_id &&
    activeCompany.company_id &&
    activeCompany.staff_role &&
    activeCompany.profiles
  ) {
    return activeCompany as UserActiveCompany;
  }

  return null;
}

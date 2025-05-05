import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

/**
 * Fetches the active company of the current user along with their profile and staff role.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @returns {Promise<{ id: string; user_id: string; company_id: string; profiles: { id: string; username: string; full_name: string; avatar_url: string }; staff_role: string } | null>} - The user's active company data with profile and staff role, or null if not found.
 */
export async function fetchAllUsersActiveCompany(supabase: TypedSupabaseClient) {
  const userId = await getUserId(supabase);

  const { data } = await supabase
    .from('user_active_companies')
    .select(
      `
      id,
      user_id,
      company_id,
      profiles:profiles!user_active_companies_company_id_fkey(id, username, full_name, avatar_url)
    `,
    )
    .eq('user_id', userId)
    .single();

  if (!data) return null;

  const { data: staffData } = await supabase
    .from('staff_members')
    .select('staff_role')
    .match({ staff_id: userId, company_id: data.company_id })
    .single();

  if (!staffData) return null;

  return {
    ...data,
    ...staffData,
  };
}

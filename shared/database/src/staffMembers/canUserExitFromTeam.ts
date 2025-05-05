import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

/**
 * Determines if a user can exit from a team.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {string} companyId - The ID of the company to check against.
 * @returns {Promise<boolean>} - Returns `true` if the user can exit, otherwise `false`.
 */
export async function canUserExitFromTeam(
  supabase: TypedSupabaseClient,
  companyId: string,
): Promise<boolean> {
  const userId = await getUserId(supabase);

  try {
    const { data, error } = await supabase
      .from('staff_members')
      .select('staff_id, company_id')
      .match({ staff_id: userId, company_id: companyId })
      .single();

    if (error || !data) return false;

    // A user cannot exit if they are the owner of the company
    return data.staff_id !== data.company_id;
  } catch (err) {
    console.error('Unexpected error while checking team exit permission:', err);
    return false;
  }
}

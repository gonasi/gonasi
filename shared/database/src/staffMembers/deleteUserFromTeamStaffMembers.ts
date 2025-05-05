import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';
import { canUserExitFromTeam } from './canUserExitFromTeam';

/**
 * Removes the authenticated user from the staff members of a given company.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<ApiResponse>} A response indicating success or failure.
 */
export async function deleteUserFromTeamStaffMembers(
  supabase: TypedSupabaseClient,
  companyId: string,
): Promise<ApiResponse> {
  const userId = await getUserId(supabase);

  try {
    if (!(await canUserExitFromTeam(supabase, companyId))) {
      return { success: false, message: 'Cannot leave your own company' };
    }

    const { error } = await supabase
      .from('staff_members')
      .delete()
      .match({ staff_id: userId, company_id: companyId });

    if (error) {
      return { success: false, message: `Failed to leave team: ${error.message}` };
    }

    return { success: true, message: 'Successfully left the team' };
  } catch (error) {
    console.error('Error removing user from team:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again.' };
  }
}

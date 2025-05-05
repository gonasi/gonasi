import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Updates the role of a staff member in the specified company.
 *
 * @param {TypedSupabaseClient} supabase - The Supabase client instance.
 * @param {string} staffId - The unique identifier of the staff member.
 * @param {string} companyId - The unique identifier of the company.
 * @param {'user' | 'admin'} staffRole - The new role to assign to the staff member.
 * @returns {Promise<ApiResponse>} - An object indicating success or failure of the operation.
 */
export const editStaffRole = async (
  supabase: TypedSupabaseClient,
  staffId: string,
  companyId: string,
  staffRole: 'user' | 'admin',
): Promise<ApiResponse> => {
  try {
    const { error } = await supabase
      .from('staff_members')
      .update({ staff_role: staffRole })
      .match({ staff_id: staffId, company_id: companyId });

    if (error) {
      return { success: false, message: 'Failed to update staff role.' };
    }

    return { success: true, message: 'Staff role updated successfully.' };
  } catch (error) {
    console.error('Error updating staff role:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again later.' };
  }
};

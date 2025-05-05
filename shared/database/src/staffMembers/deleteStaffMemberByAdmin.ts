import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

export async function deleteStaffMemberByAdmin(
  supabase: TypedSupabaseClient,
  companyId: string,
  staffId: string,
): Promise<ApiResponse> {
  try {
    if (staffId === companyId) {
      return { success: false, message: 'You can not leave your own company' };
    }

    const { error } = await supabase
      .from('staff_members')
      .delete()
      .match({ staff_id: staffId, company_id: companyId });

    if (error) {
      return { success: false, message: 'Failed to remove staff member' };
    }

    return { success: true, message: 'Staff member successfully removed' };
  } catch (error) {
    console.error('Error removing user from team:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again later.' };
  }
}

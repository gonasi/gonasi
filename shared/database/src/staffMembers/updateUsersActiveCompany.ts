import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

export async function updateUsersActiveCompany(
  supabase: TypedSupabaseClient,
  companyId: string,
): Promise<ApiResponse<{ companyId: string }>> {
  const userId = await getUserId(supabase);

  try {
    const { data, error: updateError } = await supabase
      .from('user_active_companies')
      .update({ company_id: companyId })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError || !data) {
      return { success: false, message: `Unable to update active company: ${updateError.message}` };
    }

    return {
      success: true,
      message: 'active company updated successfully.',
      data: { companyId: data.company_id },
    };
  } catch (error) {
    console.error('Unexpected error while updating active company:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again.' };
  }
}

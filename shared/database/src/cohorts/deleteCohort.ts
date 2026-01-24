import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Deletes a cohort (hard delete).
 * This will set cohort_id to NULL on all associated enrollments (via FK ON DELETE SET NULL).
 * For soft delete, use updateCohort with isActive: false instead.
 *
 * @param supabase - The Supabase client instance
 * @param cohortId - The ID of the cohort to delete
 * @returns A promise that resolves to an API response
 *
 * @example
 * ```ts
 * const result = await deleteCohort(supabase, "cohort-uuid");
 * ```
 */
export async function deleteCohort(
  supabase: TypedSupabaseClient,
  cohortId: string,
): Promise<ApiResponse<void>> {
  const userId = await getUserId(supabase);

  if (!userId) {
    return {
      success: false,
      message: 'User not authenticated.',
    };
  }

  try {
    const { error } = await supabase.from('cohorts').delete().eq('id', cohortId);

    if (error) {
      console.error('[deleteCohort] Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete cohort.',
      };
    }

    return {
      success: true,
      message: 'Cohort deleted successfully!',
    };
  } catch (err) {
    console.error('[deleteCohort] Unexpected error:', err);
    return {
      success: false,
      message: 'Something went wrong—try again in a bit.',
    };
  }
}

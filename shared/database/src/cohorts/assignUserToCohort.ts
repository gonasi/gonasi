import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Assigns a user's enrollment to a cohort (or removes from cohort if cohortId is null).
 * This will:
 * - Update the enrollment's cohort_id
 * - Trigger enrollment count updates on old and new cohorts
 * - Log the change in cohort_membership_history
 *
 * @param supabase - The Supabase client instance
 * @param enrollmentId - The ID of the enrollment to reassign
 * @param cohortId - The ID of the cohort to assign to, or null to remove from cohort
 * @returns A promise that resolves to an API response
 *
 * @example
 * ```ts
 * // Assign to cohort
 * await assignUserToCohort(supabase, "enrollment-uuid", "cohort-uuid");
 *
 * // Remove from cohort
 * await assignUserToCohort(supabase, "enrollment-uuid", null);
 * ```
 */
export async function assignUserToCohort(
  supabase: TypedSupabaseClient,
  enrollmentId: string,
  cohortId: string | null,
): Promise<ApiResponse<void>> {
  const userId = await getUserId(supabase);

  if (!userId) {
    return {
      success: false,
      message: 'User not authenticated.',
    };
  }

  try {
    const { error } = await supabase
      .from('course_enrollments')
      .update({ cohort_id: cohortId })
      .eq('id', enrollmentId);

    if (error) {
      console.error('[assignUserToCohort] Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to assign user to cohort.',
      };
    }

    return {
      success: true,
      message: cohortId
        ? 'User assigned to cohort successfully!'
        : 'User removed from cohort successfully!',
    };
  } catch (err) {
    console.error('[assignUserToCohort] Unexpected error:', err);
    return {
      success: false,
      message: 'Something went wrong—try again in a bit.',
    };
  }
}

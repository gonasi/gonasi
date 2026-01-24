import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { Database } from '../schema';
import type { ApiResponse } from '../types';

type CohortUpdate = Database['public']['Tables']['cohorts']['Update'];
type Cohort = Database['public']['Tables']['cohorts']['Row'];

export interface UpdateCohortInput {
  name?: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  maxEnrollment?: number | null;
  isActive?: boolean;
}

/**
 * Updates an existing cohort.
 * Automatically sets updated_by to the current user via trigger.
 *
 * @param supabase - The Supabase client instance
 * @param cohortId - The ID of the cohort to update
 * @param updates - The fields to update
 * @returns A promise that resolves to an API response with the updated cohort
 *
 * @example
 * ```ts
 * const result = await updateCohort(supabase, "cohort-uuid", {
 *   name: "Updated Cohort Name",
 *   maxEnrollment: 150,
 * });
 * ```
 */
export async function updateCohort(
  supabase: TypedSupabaseClient,
  cohortId: string,
  updates: UpdateCohortInput,
): Promise<ApiResponse<Cohort>> {
  const userId = await getUserId(supabase);

  if (!userId) {
    return {
      success: false,
      message: 'User not authenticated.',
    };
  }

  try {
    const updateData: CohortUpdate = {
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.startDate !== undefined && { start_date: updates.startDate }),
      ...(updates.endDate !== undefined && { end_date: updates.endDate }),
      ...(updates.maxEnrollment !== undefined && { max_enrollment: updates.maxEnrollment }),
      ...(updates.isActive !== undefined && { is_active: updates.isActive }),
      updated_by: userId,
    };

    const { data, error } = await supabase
      .from('cohorts')
      .update(updateData)
      .eq('id', cohortId)
      .select()
      .single();

    if (error || !data) {
      console.error('[updateCohort] Error:', error);
      return {
        success: false,
        message: error?.message || 'Failed to update cohort.',
      };
    }

    return {
      success: true,
      message: 'Cohort updated successfully!',
      data,
    };
  } catch (err) {
    console.error('[updateCohort] Unexpected error:', err);
    return {
      success: false,
      message: 'Something went wrong—try again in a bit.',
    };
  }
}

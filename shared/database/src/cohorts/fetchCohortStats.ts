import type { TypedSupabaseClient } from '../client';

export interface CohortStats {
  cohortId: string;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
}

/**
 * Fetches statistics for a cohort.
 * Currently returns basic enrollment counts. Can be extended to include
 * completion rates and average progress in the future.
 *
 * @param supabase - The Supabase client instance
 * @param cohortId - The ID of the cohort
 * @returns A promise that resolves to cohort statistics
 *
 * @example
 * ```ts
 * const stats = await fetchCohortStats(supabase, "cohort-uuid");
 * console.log(`Total: ${stats.totalEnrollments}, Active: ${stats.activeEnrollments}`);
 * ```
 */
export async function fetchCohortStats(
  supabase: TypedSupabaseClient,
  cohortId: string,
): Promise<CohortStats> {
  try {
    // Fetch the cohort to get denormalized count
    const { data: cohortData, error: cohortError } = await supabase
      .from('cohorts')
      .select('id, current_enrollment_count')
      .eq('id', cohortId)
      .single();

    if (cohortError) {
      throw cohortError;
    }

    // Fetch detailed enrollment stats
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select('is_active, expires_at, completed_at')
      .eq('cohort_id', cohortId);

    if (enrollmentsError) {
      throw enrollmentsError;
    }

    const now = new Date();
    const activeEnrollments = enrollments?.filter((e) => {
      return e.is_active && (!e.expires_at || new Date(e.expires_at) > now);
    }).length || 0;

    const completedEnrollments = enrollments?.filter((e) => e.completed_at !== null).length || 0;

    return {
      cohortId,
      totalEnrollments: cohortData?.current_enrollment_count || 0,
      activeEnrollments,
      completedEnrollments,
    };
  } catch (err) {
    console.error('[fetchCohortStats] Error:', err);
    return {
      cohortId,
      totalEnrollments: 0,
      activeEnrollments: 0,
      completedEnrollments: 0,
    };
  }
}

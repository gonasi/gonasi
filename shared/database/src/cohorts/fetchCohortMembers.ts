import type { TypedSupabaseClient } from '../client';
import type { Database } from '../schema';

type CourseEnrollment = Database['public']['Tables']['course_enrollments']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export interface CohortMember {
  enrollment: CourseEnrollment;
  profile: Profile | null;
}

/**
 * Fetches all members (enrollments + user profiles) for a specific cohort.
 *
 * @param supabase - The Supabase client instance
 * @param cohortId - The ID of the cohort
 * @returns A promise that resolves to an array of cohort members with enrollment and profile data
 *
 * @example
 * ```ts
 * const members = await fetchCohortMembers(supabase, "cohort-uuid");
 * console.log("Cohort has", members.length, "members");
 * ```
 */
export async function fetchCohortMembers(
  supabase: TypedSupabaseClient,
  cohortId: string,
): Promise<CohortMember[]> {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select(
      `
      *,
      profiles (*)
    `,
    )
    .eq('cohort_id', cohortId)
    .order('enrolled_at', { ascending: false });

  if (error) {
    console.error('[fetchCohortMembers] Error:', error.message);
    throw error;
  }

  return (
    data?.map((enrollment) => ({
      enrollment: {
        ...enrollment,
        profiles: undefined,
      } as CourseEnrollment,
      profile: (enrollment.profiles as unknown as Profile) || null,
    })) || []
  );
}

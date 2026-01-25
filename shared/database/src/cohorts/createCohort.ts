import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { Database } from '../schema';
import type { ApiResponse } from '../types';

type CohortInsert = Database['public']['Tables']['cohorts']['Insert'];
type Cohort = Database['public']['Tables']['cohorts']['Row'];

export interface CreateCohortInput {
  organizationId: string;
  publishedCourseId: string;
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  maxEnrollment?: number | null;
  isActive?: boolean;
}

/**
 * Creates a new cohort for a published course.
 * Automatically sets created_by and updated_by to the current user.
 *
 * @param supabase - The Supabase client instance
 * @param input - The cohort data to create
 * @returns A promise that resolves to an API response with the created cohort
 *
 * @example
 * ```ts
 * const result = await createCohort(supabase, {
 *   organizationId: "org-uuid",
 *   publishedCourseId: "course-uuid",
 *   name: "Fall 2024 Cohort",
 *   description: "Fall semester cohort",
 *   startDate: "2024-09-01T00:00:00Z",
 *   endDate: "2024-12-31T23:59:59Z",
 *   maxEnrollment: 100,
 * });
 * ```
 */
export async function createCohort(
  supabase: TypedSupabaseClient,
  input: CreateCohortInput,
): Promise<ApiResponse<Cohort>> {
  const userId = await getUserId(supabase);

  if (!userId) {
    return {
      success: false,
      message: 'User not authenticated.',
    };
  }

  try {
    // 1️⃣ Check if cohort name already exists (scoped)
    const { data: existingCohort, error: existsError } = await supabase
      .from('cohorts')
      .select('id')
      .eq('organization_id', input.organizationId)
      .eq('published_course_id', input.publishedCourseId)
      .ilike('name', input.name)
      .maybeSingle();

    if (existsError) {
      console.error('[createCohort] Name check error:', existsError);
      return {
        success: false,
        message: 'Unable to validate cohort name. Please try again.',
      };
    }

    if (existingCohort) {
      return {
        success: false,
        message: `A cohort named "${input.name}" already exists for this course.`,
      };
    }

    // 2️⃣ Create cohort
    const cohortData: CohortInsert = {
      organization_id: input.organizationId,
      published_course_id: input.publishedCourseId,
      name: input.name,
      description: input.description,
      start_date: input.startDate,
      end_date: input.endDate,
      max_enrollment: input.maxEnrollment,
      is_active: input.isActive ?? true,
      created_by: userId,
      updated_by: userId,
    };

    const { data, error } = await supabase.from('cohorts').insert(cohortData).select().single();

    if (error || !data) {
      console.error('[createCohort] Insert error:', error);
      return {
        success: false,
        message: error?.message || 'Failed to create cohort.',
      };
    }

    return {
      success: true,
      message: 'Cohort created successfully!',
      data,
    };
  } catch (err) {
    console.error('[createCohort] Unexpected error:', err);
    return {
      success: false,
      message: 'Something went wrong—try again in a bit.',
    };
  }
}

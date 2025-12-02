import type { TypedSupabaseClient } from '../../client';
import type { TierStatus } from './tierLimitsTypes';

/**
 * Result object for checking max free courses
 */
export interface FreeCoursesUsageResult {
  /** Maximum allowed free courses for this org */
  max_free_courses: number;

  /** Current number of free courses */
  current_free_courses: number;

  /** True if limit has been reached */
  exceeded_limit: boolean;

  /** True if limit is approaching (>= 80%) */
  approaching_limit: boolean;

  /** Status string */
  status: TierStatus;
}

/**
 * Options for checking free courses usage
 */
export interface FreeCoursesUsageOptions {
  supabase: TypedSupabaseClient;
  organizationId: string;
  maxFreeCourses: number;
}

/**
 * ---------------------------------------------------------------------------
 * Checks an organization's usage against the max free courses limit
 * ---------------------------------------------------------------------------
 */
export const getOrganizationFreeCoursesUsage = async ({
  supabase,
  organizationId,
  maxFreeCourses,
}: FreeCoursesUsageOptions): Promise<FreeCoursesUsageResult> => {
  // Fetch number of active free published courses
  const { data: freeCourses, error } = await supabase
    .from('published_courses')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .eq('has_free_tier', true);

  if (error) {
    throw new Error(`Failed to fetch free courses: ${error.message}`);
  }

  const currentFreeCourses = freeCourses?.length ?? 0;

  const exceeded_limit = currentFreeCourses >= maxFreeCourses;
  const approaching_limit = !exceeded_limit && currentFreeCourses / maxFreeCourses >= 0.8;

  let status: TierStatus = 'success';
  if (exceeded_limit) status = 'error';
  else if (approaching_limit) status = 'warning';

  return {
    max_free_courses: maxFreeCourses,
    current_free_courses: currentFreeCourses,
    exceeded_limit,
    approaching_limit,
    status,
  };
};

import type { TypedSupabaseClient } from '../client';

/**
 * Arguments required to fetch re-enrollment statistics.
 */
export interface FetchReEnrollmentStatsArgs {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

/**
 * Represents re-enrollment statistics for an organization.
 * A re-enrollment occurs when a user has multiple activity records for the same enrollment.
 */
export interface ReEnrollmentStats {
  /** Total number of re-enrollments across all enrollments */
  total_re_enrollments: number;

  /** Re-enrollments that occurred last month */
  last_month_re_enrollments: number;

  /** Re-enrollments that occurred this month */
  this_month_re_enrollments: number;
}

/**
 * Standardized result type for API calls
 */
interface Result<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export type FetchReEnrollmentStatsResult = Result<ReEnrollmentStats>;

/**
 * Fetches re-enrollment statistics for a given organization.
 * A re-enrollment is counted when a user has multiple activity records for the same enrollment_id.
 * This indicates they renewed or re-subscribed to a course they were previously enrolled in.
 */
export async function fetchTotalReEnrollmentStats({
  supabase,
  organizationId,
}: FetchReEnrollmentStatsArgs): Promise<FetchReEnrollmentStatsResult> {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

  try {
    // === TOTAL RE-ENROLLMENTS ===
    // Get all activities for the organization, grouped by enrollment_id
    const { data: allActivities, error: totalError } = await supabase
      .from('course_enrollment_activities')
      .select('enrollment_id, course_enrollments!inner(organization_id)')
      .eq('course_enrollments.organization_id', organizationId);

    if (totalError) {
      return {
        success: false,
        message: `Failed to fetch total activities: ${totalError.message}`,
        data: null,
      };
    }

    // Count enrollments that have more than 1 activity (re-enrollments)
    const activityCounts = new Map<string, number>();
    allActivities?.forEach((activity) => {
      const count = activityCounts.get(activity.enrollment_id) || 0;
      activityCounts.set(activity.enrollment_id, count + 1);
    });

    // Total re-enrollments = sum of (activity_count - 1) for each enrollment with multiple activities
    const totalReEnrollments = Array.from(activityCounts.values())
      .filter((count) => count > 1)
      .reduce((sum, count) => sum + (count - 1), 0);

    // === LAST MONTH RE-ENROLLMENTS ===
    const { data: lastMonthActivities, error: lastMonthError } = await supabase
      .from('course_enrollment_activities')
      .select('enrollment_id, access_start, course_enrollments!inner(organization_id)')
      .eq('course_enrollments.organization_id', organizationId)
      .gte('access_start', startOfLastMonth)
      .lte('access_start', endOfLastMonth)
      .order('enrollment_id')
      .order('access_start');

    if (lastMonthError) {
      return {
        success: false,
        message: `Failed to fetch last month activities: ${lastMonthError.message}`,
        data: null,
      };
    }

    // For each enrollment_id in last month, check if it's a re-enrollment
    // (i.e., there's an earlier activity for the same enrollment)
    const { data: allPriorActivities, error: priorError } = await supabase
      .from('course_enrollment_activities')
      .select('enrollment_id, access_start, course_enrollments!inner(organization_id)')
      .eq('course_enrollments.organization_id', organizationId)
      .lt('access_start', startOfLastMonth);

    if (priorError) {
      return {
        success: false,
        message: `Failed to fetch prior activities: ${priorError.message}`,
        data: null,
      };
    }

    const priorEnrollments = new Set(allPriorActivities?.map((a) => a.enrollment_id) || []);

    const lastMonthReEnrollments =
      lastMonthActivities?.filter((activity) => priorEnrollments.has(activity.enrollment_id))
        .length || 0;

    // === THIS MONTH RE-ENROLLMENTS ===
    const { data: thisMonthActivities, error: thisMonthError } = await supabase
      .from('course_enrollment_activities')
      .select('enrollment_id, access_start, course_enrollments!inner(organization_id)')
      .eq('course_enrollments.organization_id', organizationId)
      .gte('access_start', startOfThisMonth)
      .order('enrollment_id')
      .order('access_start');

    if (thisMonthError) {
      return {
        success: false,
        message: `Failed to fetch this month activities: ${thisMonthError.message}`,
        data: null,
      };
    }

    // Check if each activity this month is a re-enrollment
    const priorToThisMonth = new Set(
      allPriorActivities
        ?.map((a) => a.enrollment_id)
        .concat(lastMonthActivities?.map((a) => a.enrollment_id) || []) || [],
    );

    const thisMonthReEnrollments =
      thisMonthActivities?.filter((activity) => priorToThisMonth.has(activity.enrollment_id))
        .length || 0;

    return {
      success: true,
      message: 'Successfully fetched re-enrollment statistics',
      data: {
        total_re_enrollments: totalReEnrollments,
        last_month_re_enrollments: lastMonthReEnrollments,
        this_month_re_enrollments: thisMonthReEnrollments,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      data: null,
    };
  }
}

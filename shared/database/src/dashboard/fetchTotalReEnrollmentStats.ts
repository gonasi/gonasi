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
 */
export interface ReEnrollmentStats {
  /** Total number of re-enrollments across all enrollments */
  total_re_enrollments: number;

  /** Re-enrollments that occurred last month */
  last_month_re_enrollments: number;

  /** Re-enrollments that occurred this month */
  this_month_re_enrollments: number;

  /** Percent growth from last month to this month (can be negative) */
  percent_growth: number | null;
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

    const totalReEnrollments = Array.from(activityCounts.values())
      .filter((count) => count > 1)
      .reduce((sum, count) => sum + (count - 1), 0);

    // === LAST MONTH RE-ENROLLMENTS ===
    const { data: lastMonthActivities, error: lastMonthError } = await supabase
      .from('course_enrollment_activities')
      .select('enrollment_id, access_start, course_enrollments!inner(organization_id)')
      .eq('course_enrollments.organization_id', organizationId)
      .gte('access_start', startOfLastMonth)
      .lte('access_start', endOfLastMonth);

    if (lastMonthError) {
      return {
        success: false,
        message: `Failed to fetch last month activities: ${lastMonthError.message}`,
        data: null,
      };
    }

    // Fetch all prior activities before last month
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
      lastMonthActivities?.filter((a) => priorEnrollments.has(a.enrollment_id)).length || 0;

    // === THIS MONTH RE-ENROLLMENTS ===
    const { data: thisMonthActivities, error: thisMonthError } = await supabase
      .from('course_enrollment_activities')
      .select('enrollment_id, access_start, course_enrollments!inner(organization_id)')
      .eq('course_enrollments.organization_id', organizationId)
      .gte('access_start', startOfThisMonth);

    if (thisMonthError) {
      return {
        success: false,
        message: `Failed to fetch this month activities: ${thisMonthError.message}`,
        data: null,
      };
    }

    const priorToThisMonth = new Set(
      allPriorActivities
        ?.map((a) => a.enrollment_id)
        .concat(lastMonthActivities?.map((a) => a.enrollment_id) || []) || [],
    );

    const thisMonthReEnrollments =
      thisMonthActivities?.filter((a) => priorToThisMonth.has(a.enrollment_id)).length || 0;

    // === PERCENT GROWTH CALCULATION ===
    const lastCount = lastMonthReEnrollments;
    const thisCount = thisMonthReEnrollments;
    let percentGrowth: number;

    if (lastCount > 0) {
      percentGrowth = ((thisCount - lastCount) / lastCount) * 100;
    } else {
      // If last month had 0 re-enrollments, any new ones count as strong growth
      percentGrowth = thisCount > 0 ? thisCount * 100 : 0;
    }

    return {
      success: true,
      message: 'Successfully fetched re-enrollment statistics',
      data: {
        total_re_enrollments: totalReEnrollments,
        last_month_re_enrollments: lastCount,
        this_month_re_enrollments: thisCount,
        percent_growth: Number(percentGrowth.toFixed(2)),
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

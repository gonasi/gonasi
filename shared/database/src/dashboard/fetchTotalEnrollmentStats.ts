import type { TypedSupabaseClient } from '../client';

/**
 * Arguments required to fetch enrollment statistics.
 */
export interface FetchTotalEnrollmentStatsArgs {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

/**
 * Represents enrollment statistics for an organization.
 */
export interface EnrollmentStats {
  /** Total number of enrollment activities ever made to courses owned by the organization */
  total_enrollments: number;

  /** Number of currently active enrollments (unique user-course pairs) */
  active_enrollments: number;

  /** Month-over-month growth of new enrollment activities (%) */
  percent_growth: number;

  /** New enrollment activities last month (based on access_start) */
  last_month_new_enrollments: number;

  /** New enrollment activities this month (based on access_start) */
  this_month_new_enrollments: number;
}

/**
 * Standardized result type for API calls
 */
interface Result<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export type FetchTotalEnrollmentStatsResult = Result<EnrollmentStats>;

/**
 * Fetches enrollment statistics for a given organization.
 * Calculates total enrollment activities (including re-enrollments),
 * active unique enrollments, and MoM growth of activities.
 */
export async function fetchTotalEnrollmentStats({
  supabase,
  organizationId,
}: FetchTotalEnrollmentStatsArgs): Promise<FetchTotalEnrollmentStatsResult> {
  const now = new Date();

  // Use UTC to match the database timezone
  const startOfThisMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();
  const startOfLastMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  ).toISOString();

  const safe = (n?: number | null): number => (n && !isNaN(n) ? n : 0);

  try {
    // === TOTAL ENROLLMENT ACTIVITIES (including re-enrollments) ===
    const { count: totalEnrollments, error: totalError } = await supabase
      .from('course_enrollment_activities')
      .select('id, enrollment_id!inner(organization_id)', { count: 'exact', head: true })
      .eq('enrollment_id.organization_id', organizationId);

    if (totalError) throw new Error(`total enrollments: ${totalError.message}`);

    // === ACTIVE ENROLLMENTS (unique user-course pairs) ===
    const { count: activeEnrollments, error: activeError } = await supabase
      .from('course_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (activeError) throw new Error(`active enrollments: ${activeError.message}`);

    // === LAST MONTH NEW ENROLLMENT ACTIVITIES ===
    // Count activities where access_start is in last month
    const { count: lastMonthCount, error: lastMonthError } = await supabase
      .from('course_enrollment_activities')
      .select('id, enrollment_id!inner(organization_id)', { count: 'exact', head: true })
      .eq('enrollment_id.organization_id', organizationId)
      .gte('access_start', startOfLastMonth)
      .lt('access_start', startOfThisMonth);

    if (lastMonthError) throw new Error(`last month enrollments: ${lastMonthError.message}`);

    // === THIS MONTH NEW ENROLLMENT ACTIVITIES ===
    // Count activities where access_start is in this month
    const { count: thisMonthCount, error: thisMonthError } = await supabase
      .from('course_enrollment_activities')
      .select('id, enrollment_id!inner(organization_id)', { count: 'exact', head: true })
      .eq('enrollment_id.organization_id', organizationId)
      .gte('access_start', startOfThisMonth);

    if (thisMonthError) throw new Error(`this month enrollments: ${thisMonthError.message}`);

    // === CALCULATE MOM GROWTH ===
    const totalEnroll = safe(totalEnrollments);
    const activeEnroll = safe(activeEnrollments);
    const lastCount = safe(lastMonthCount);
    const thisCount = safe(thisMonthCount);

    let percentGrowth: number;

    if (lastCount > 0) {
      percentGrowth = ((thisCount - lastCount) / lastCount) * 100;
    } else {
      // If no enrollments last month, show 100% if we have enrollments this month, 0 otherwise
      percentGrowth = thisCount > 0 ? 100 : 0;
    }

    return {
      success: true,
      message: 'Successfully fetched enrollment statistics',
      data: {
        total_enrollments: totalEnroll,
        active_enrollments: activeEnroll,
        percent_growth: Math.round(percentGrowth),
        last_month_new_enrollments: lastCount,
        this_month_new_enrollments: thisCount,
      },
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to fetch enrollment stats: ${(err as Error).message}`,
      data: null,
    };
  }
}

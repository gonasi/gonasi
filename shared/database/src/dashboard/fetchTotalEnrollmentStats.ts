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
  /** Total number of enrollments in the organization */
  total_enrollments: number;

  /** Number of currently active enrollments */
  active_enrollments: number;

  /** Month-over-month growth of new enrollments (%) */
  percent_growth: number;

  /** New enrollments last month (based on access_start) */
  last_month_new_enrollments: number;

  /** New enrollments this month (based on access_start) */
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
 * Calculates total enrollments, active enrollments, and MoM growth.
 */
export async function fetchTotalEnrollmentStats({
  supabase,
  organizationId,
}: FetchTotalEnrollmentStatsArgs): Promise<FetchTotalEnrollmentStatsResult> {
  const now = new Date();
  const nowIso = now.toISOString();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

  const safe = (n?: number | null): number => (n && !isNaN(n) ? n : 0);

  // === TOTAL ENROLLMENTS ===
  const { count: totalEnrollments, error: totalError } = await supabase
    .from('course_enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  if (totalError) {
    return {
      success: false,
      message: `Failed to fetch total enrollments: ${totalError.message}`,
      data: null,
    };
  }

  // === ACTIVE ENROLLMENTS ===
  // An enrollment is active if is_active = true AND (expires_at is in the future OR null)
  const { count: activeEnrollments, error: activeError } = await supabase
    .from('course_enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .or(`expires_at.gt.${nowIso},expires_at.is.null`);

  if (activeError) {
    return {
      success: false,
      message: `Failed to fetch active enrollments: ${activeError.message}`,
      data: null,
    };
  }

  // === LAST MONTH NEW ENROLLMENTS ===
  const { count: lastMonthCount, error: lastMonthError } = await supabase
    .from('course_enrollment_activities')
    .select('id, course_enrollments!inner(organization_id)', { count: 'exact', head: true })
    .eq('course_enrollments.organization_id', organizationId)
    .gte('access_start', startOfLastMonth)
    .lte('access_start', endOfLastMonth);

  if (lastMonthError) {
    return {
      success: false,
      message: `Failed to fetch last month enrollments: ${lastMonthError.message}`,
      data: null,
    };
  }

  // === THIS MONTH NEW ENROLLMENTS ===
  const { count: thisMonthCount, error: thisMonthError } = await supabase
    .from('course_enrollment_activities')
    .select('id, course_enrollments!inner(organization_id)', { count: 'exact', head: true })
    .eq('course_enrollments.organization_id', organizationId)
    .gte('access_start', startOfThisMonth)
    .lte('access_start', nowIso);

  if (thisMonthError) {
    return {
      success: false,
      message: `Failed to fetch this month enrollments: ${thisMonthError.message}`,
      data: null,
    };
  }

  // === CALCULATE MOM GROWTH ===
  const totalEnroll = safe(totalEnrollments);
  const activeEnroll = safe(activeEnrollments);
  const lastCount = safe(lastMonthCount);
  const thisCount = safe(thisMonthCount);

  let percentGrowth: number;

  if (lastCount > 0) {
    percentGrowth = ((thisCount - lastCount) / lastCount) * 100;
  } else {
    // If last month had 0 enrollments, any new enrollments counts as growth
    percentGrowth = thisCount > 0 ? thisCount * 100 : 0;
  }

  return {
    success: true,
    message: 'Successfully fetched enrollment statistics',
    data: {
      total_enrollments: totalEnroll,
      active_enrollments: activeEnroll,
      percent_growth: Math.round(percentGrowth), // 0 decimal places
      last_month_new_enrollments: lastCount,
      this_month_new_enrollments: thisCount,
    },
  };
}

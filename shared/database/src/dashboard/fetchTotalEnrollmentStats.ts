import type { TypedSupabaseClient } from '../client';

export interface FetchTotalEnrollmentStatsArgs {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

export interface EnrollmentStats {
  total_enrollments: string;
  active_enrollments: string;
  percent_growth: number; // MoM growth of new enrollments (based on access_start)
  last_month_new_enrollments: string; // Formatted count of new enrollments last month
  this_month_new_enrollments: string; // Formatted count of new enrollments this month
}

interface Result<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export type FetchTotalEnrollmentStatsResult = Result<EnrollmentStats>;

/**
 * Formats a number to compact notation (e.g., 1.5k, 2.3m)
 */
function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return value.toString();
}

export async function fetchTotalEnrollmentStats({
  supabase,
  organizationId,
}: FetchTotalEnrollmentStatsArgs): Promise<FetchTotalEnrollmentStatsResult> {
  const now = new Date();
  const nowIso = now.toISOString();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

  // TOTAL ENROLLMENTS (count rows in course_enrollments)
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

  // ACTIVE ENROLLMENTS
  const { count: activeEnrollments, error: activeError } = await supabase
    .from('course_enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .or(
      `and(expires_at.is.null,expires_at.gt.${nowIso}),expires_at.gt.${nowIso},expires_at.is.null`,
    );

  if (activeError) {
    return {
      success: false,
      message: `Failed to fetch active enrollments: ${activeError.message}`,
      data: null,
    };
  }

  // LAST MONTH NEW ENROLLMENTS (based on course_enrollment_activities.access_start)
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

  // THIS MONTH NEW ENROLLMENTS (based on access_start)
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

  // CALCULATE GROWTH (MoM new enrollments based on access_start)
  const totalEnroll = totalEnrollments ?? 0;
  const activeEnroll = activeEnrollments ?? 0;
  const lastCount = lastMonthCount ?? 0;
  const thisCount = thisMonthCount ?? 0;

  let percentGrowth: number;
  if (lastCount > 0) {
    percentGrowth = ((thisCount - lastCount) / lastCount) * 100;
  } else if (thisCount > 0) {
    percentGrowth = 100;
  } else {
    percentGrowth = 0;
  }

  return {
    success: true,
    message: 'Successfully fetched enrollment statistics',
    data: {
      total_enrollments: formatCompactNumber(totalEnroll),
      active_enrollments: formatCompactNumber(activeEnroll),
      percent_growth: Number(percentGrowth.toFixed(2)),
      last_month_new_enrollments: formatCompactNumber(lastCount),
      this_month_new_enrollments: formatCompactNumber(thisCount),
    },
  };
}

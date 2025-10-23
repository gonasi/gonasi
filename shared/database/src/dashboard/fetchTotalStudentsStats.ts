import type { TypedSupabaseClient } from '../client';

export interface FetchTotalStudentsStatsArgs {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

export interface StudentStats {
  total_students: number;
  percent_growth: number;
}

export interface Result<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export type FetchTotalStudentsStatsResult = Result<StudentStats>;

/**
 * Fetches total student enrollments and month-over-month growth for an organization.
 *
 * - total_students: count of all rows in course_enrollments for the org
 * - percent_growth: growth of new enrollments this month vs last month
 */
export async function fetchTotalStudentsStats({
  supabase,
  organizationId,
}: FetchTotalStudentsStatsArgs): Promise<FetchTotalStudentsStatsResult> {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // ═══════════════════════════════════════════════════════════════
  // TOTAL ENROLLMENTS
  // ═══════════════════════════════════════════════════════════════
  const { count: totalStudents, error: totalError } = await supabase
    .from('course_enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  if (totalError) {
    return {
      success: false,
      message: `Failed to fetch total students: ${totalError.message}`,
      data: null,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // LAST MONTH ENROLLMENTS
  // ═══════════════════════════════════════════════════════════════
  const { count: lastMonthCountRaw, error: lastMonthError } = await supabase
    .from('course_enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', startOfLastMonth.toISOString())
    .lte('created_at', endOfLastMonth.toISOString());

  if (lastMonthError) {
    return {
      success: false,
      message: `Failed to fetch last month enrollments: ${lastMonthError.message}`,
      data: null,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // THIS MONTH ENROLLMENTS
  // ═══════════════════════════════════════════════════════════════
  const { count: thisMonthCountRaw, error: thisMonthError } = await supabase
    .from('course_enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', startOfThisMonth.toISOString());

  if (thisMonthError) {
    return {
      success: false,
      message: `Failed to fetch this month enrollments: ${thisMonthError.message}`,
      data: null,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // CALCULATE GROWTH
  // ═══════════════════════════════════════════════════════════════
  const total = totalStudents ?? 0;
  const lastMonthCount = lastMonthCountRaw ?? 0;
  const thisMonthCount = thisMonthCountRaw ?? 0;

  let percentGrowth: number;
  if (lastMonthCount > 0) {
    percentGrowth = ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
  } else if (thisMonthCount > 0) {
    percentGrowth = 100;
  } else {
    percentGrowth = 0;
  }

  // ═══════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════
  return {
    success: true,
    message: 'Successfully fetched student enrollment statistics',
    data: {
      total_students: total,
      percent_growth: Number(percentGrowth.toFixed(2)),
    },
  };
}

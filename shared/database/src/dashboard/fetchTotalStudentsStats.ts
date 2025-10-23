import type { TypedSupabaseClient } from '../client';

export interface FetchTotalStudentsStatsArgs {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

export interface StudentStats {
  total_unique_students: number;
  total_enrollments: number;
  percent_growth: number;
}

export interface Result<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export type FetchTotalStudentsStatsResult = Result<StudentStats>;

/**
 * Fetches total unique students, total enrollments, and month-over-month
 * growth in enrollments for an organization.
 *
 * - total_unique_students: count of distinct user_ids in course_enrollments
 * - total_enrollments: count of all enrollment rows
 * - percent_growth: growth of new enrollments (rows) this month vs last month
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
  // TOTAL UNIQUE STUDENTS
  // ═══════════════════════════════════════════════════════════════
  const { count: totalUniqueStudents, error: uniqueError } = await supabase
    .from('course_enrollments')
    .select('user_id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  if (uniqueError) {
    return {
      success: false,
      message: `Failed to fetch unique students: ${uniqueError.message}`,
      data: null,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // TOTAL ENROLLMENTS (including duplicates)
  // ═══════════════════════════════════════════════════════════════
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
  // CALCULATE GROWTH (based on total enrollments)
  // ═══════════════════════════════════════════════════════════════
  const totalEnroll = totalEnrollments ?? 0;
  const uniqueStudents = totalUniqueStudents ?? 0;
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
      total_unique_students: uniqueStudents,
      total_enrollments: totalEnroll,
      percent_growth: Number(percentGrowth.toFixed(2)),
    },
  };
}

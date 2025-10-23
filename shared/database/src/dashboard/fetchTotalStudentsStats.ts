import type { TypedSupabaseClient } from '../client';

export interface FetchTotalStudentsStatsArgs {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

export interface StudentStats {
  total_unique_students: string;
  total_enrollments: string;
  active_students: string;
  percent_growth: number;
  this_month_enrollments: string;
  last_month_enrollments: string;
}

export interface Result<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export type FetchTotalStudentsStatsResult = Result<StudentStats>;

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

/**
 * Fetches total unique students, total enrollments, active students,
 * and month-over-month growth in enrollments for an organization.
 *
 * - total_unique_students: distinct user_ids in course_enrollments
 * - total_enrollments: count of all enrollment rows
 * - active_students: count of distinct user_ids where is_active = true
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

  const safe = (n?: number) => (n && !isNaN(n) ? n : 0);

  try {
    // ═══════════════════════════════════════════════════════════════
    // TOTAL UNIQUE STUDENTS
    // ═══════════════════════════════════════════════════════════════
    const { count: totalUniqueStudents, error: uniqueError } = await supabase
      .from('course_enrollments')
      .select('user_id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (uniqueError) throw new Error(`unique students: ${uniqueError.message}`);

    // ═══════════════════════════════════════════════════════════════
    // TOTAL ENROLLMENTS
    // ═══════════════════════════════════════════════════════════════
    const { count: totalEnrollments, error: totalError } = await supabase
      .from('course_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (totalError) throw new Error(`total enrollments: ${totalError.message}`);

    // ═══════════════════════════════════════════════════════════════
    // ACTIVE STUDENTS (distinct user_ids where is_active = true)
    // ═══════════════════════════════════════════════════════════════
    const { count: activeStudents, error: activeError } = await supabase
      .from('course_enrollments')
      .select('user_id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (activeError) throw new Error(`active students: ${activeError.message}`);

    // ═══════════════════════════════════════════════════════════════
    // LAST MONTH ENROLLMENTS
    // ═══════════════════════════════════════════════════════════════
    const { count: lastMonthCount, error: lastMonthError } = await supabase
      .from('course_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', startOfLastMonth.toISOString())
      .lte('created_at', endOfLastMonth.toISOString());

    if (lastMonthError) throw new Error(`last month enrollments: ${lastMonthError.message}`);

    // ═══════════════════════════════════════════════════════════════
    // THIS MONTH ENROLLMENTS
    // ═══════════════════════════════════════════════════════════════
    const { count: thisMonthCount, error: thisMonthError } = await supabase
      .from('course_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', startOfThisMonth.toISOString());

    if (thisMonthError) throw new Error(`this month enrollments: ${thisMonthError.message}`);

    // ═══════════════════════════════════════════════════════════════
    // CALCULATE GROWTH
    // ═══════════════════════════════════════════════════════════════
    const last = safe(lastMonthCount ?? 0);
    const current = safe(thisMonthCount ?? 0);

    const percentGrowth = last > 0 ? ((current - last) / last) * 100 : current > 0 ? 100 : 0;

    // ═══════════════════════════════════════════════════════════════
    // RETURN SUCCESS WITH FORMATTED VALUES
    // ═══════════════════════════════════════════════════════════════
    return {
      success: true,
      message: 'Successfully fetched student enrollment statistics',
      data: {
        total_unique_students: formatCompactNumber(safe(totalUniqueStudents ?? 0)),
        total_enrollments: formatCompactNumber(safe(totalEnrollments ?? 0)),
        active_students: formatCompactNumber(safe(activeStudents ?? 0)),
        percent_growth: Number(percentGrowth.toFixed(2)),
        this_month_enrollments: formatCompactNumber(current),
        last_month_enrollments: formatCompactNumber(last),
      },
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to fetch student stats: ${(err as Error).message}`,
      data: null,
    };
  }
}

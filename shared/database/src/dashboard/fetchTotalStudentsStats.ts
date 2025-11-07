import type { TypedSupabaseClient } from '../client';
import { getUserOrgRole } from '../organizations';

/**
 * Arguments for fetching total student statistics.
 */
export interface FetchTotalStudentsStatsArgs {
  /** Supabase client instance (typed wrapper). */
  supabase: TypedSupabaseClient;
  /** Organization ID to filter course enrollments by. */
  organizationId: string;
}

/**
 * Student statistics for a given organization.
 */
export interface StudentStats {
  /** Total number of unique students (distinct user_ids) enrolled. */
  total_unique_students: number;
  /** Total number of enrollment records. */
  total_enrollments: number;
  /** Total number of active students (distinct user_ids where is_active = true). */
  active_students: number;
  /** Month-over-month percent growth in enrollments. Can be negative or >100. */
  percent_growth: number;
  /** Total number of enrollments created this month. */
  this_month_enrollments: number;
  /** Total number of enrollments created last month. */
  last_month_enrollments: number;
}

/**
 * Generic result shape returned by data-fetching utilities.
 */
export interface Result<T> {
  /** Indicates if the operation succeeded. */
  success: boolean;
  /** Human-readable message describing the result. */
  message: string;
  /** The data payload (or null on failure). */
  data: T | null;
}

/**
 * The result type for `fetchTotalStudentsStats`.
 */
export type FetchTotalStudentsStatsResult = Result<StudentStats>;

/**
 * Fetches total unique students, total enrollments, active students,
 * and month-over-month growth in enrollments for an organization.
 *
 * **Returned fields:**
 * - `total_unique_students`: count of distinct `user_id` in `course_enrollments`
 * - `total_enrollments`: total number of enrollment rows
 * - `active_students`: count of distinct `user_id` where `is_active = true`
 * - `percent_growth`: growth of new enrollments this month vs last month
 * - `this_month_enrollments`: enrollments created since start of current month
 * - `last_month_enrollments`: enrollments created in previous month
 */
export async function fetchTotalStudentsStats({
  supabase,
  organizationId,
}: FetchTotalStudentsStatsArgs): Promise<FetchTotalStudentsStatsResult> {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const safe = (n?: number | null): number => (n && !isNaN(n) ? n : 0);

  try {
    const role = await getUserOrgRole({ supabase, organizationId });

    if (!role || role === 'editor') {
      return {
        success: false,
        message: 'You do not have permission to view this content.',
        data: null,
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // TOTAL UNIQUE STUDENTS
    // ═══════════════════════════════════════════════════════════════
    const { data: totalUniqueStudents, error: uniqueError } = await supabase.rpc(
      'count_total_unique_students',
      { org_id: organizationId },
    );

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
    const { data: activeStudents, error: activeError } = await supabase.rpc(
      'count_active_students',
      { org_id: organizationId },
    );

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
    const last = safe(lastMonthCount);
    const current = safe(thisMonthCount);

    let percentGrowth: number;

    if (last > 0) {
      percentGrowth = ((current - last) / last) * 100;
    } else {
      percentGrowth = current > 0 ? current * 100 : 0;
    }

    // ═══════════════════════════════════════════════════════════════
    // RETURN SUCCESS
    // ═══════════════════════════════════════════════════════════════
    return {
      success: true,
      message: 'Successfully fetched student enrollment statistics',
      data: {
        total_unique_students: safe(totalUniqueStudents),
        total_enrollments: safe(totalEnrollments),
        active_students: safe(activeStudents),
        percent_growth: Math.round(percentGrowth), // 0 decimal places
        this_month_enrollments: current,
        last_month_enrollments: last,
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

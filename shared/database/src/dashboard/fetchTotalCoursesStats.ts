import type { TypedSupabaseClient } from '../client';
import { getUserOrgRole } from '../organizations';

interface FetchTotalCoursesStatsArgs {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

interface CourseStats {
  total_courses: number;
  published_courses: number;
  unpublished_courses: number;
  percent_growth: number;
}

interface Result<T> {
  success: boolean;
  message: string;
  data: T | null;
}

/**
 * Fetches comprehensive course statistics for an organization
 *
 * Calculates:
 * - Total courses (all courses regardless of status)
 * - Published courses (courses that are live/available)
 * - Unpublished courses (difference between total and published)
 * - Growth percentage (based on published courses month-over-month)
 *
 * @param supabase - Typed Supabase client instance
 * @param organizationId - UUID of the organization to fetch stats for
 * @returns Result object containing course statistics or error details
 */
export async function fetchTotalCoursesStats({
  supabase,
  organizationId,
}: FetchTotalCoursesStatsArgs): Promise<Result<CourseStats>> {
  const role = await getUserOrgRole({ supabase, organizationId });

  if (!role || role === 'editor') {
    return {
      success: false,
      message: 'You do not have permission to view this content.',
      data: null,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // DATE RANGE CALCULATION
  // ═══════════════════════════════════════════════════════════════
  // Calculate month boundaries for growth comparison
  // This month: From 1st of current month to now
  // Last month: From 1st to last day of previous month
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // ═══════════════════════════════════════════════════════════════
  // FETCH TOTAL COURSES
  // ═══════════════════════════════════════════════════════════════
  // Get count of all courses for this organization (published + unpublished)
  // Using head: true for performance since we only need the count
  const { count: totalCourses, error: totalError } = await supabase
    .from('courses')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  if (totalError) {
    return {
      success: false,
      message: `Failed to fetch total courses: ${totalError.message}`,
      data: null,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // FETCH PUBLISHED COURSES
  // ═══════════════════════════════════════════════════════════════
  // Get count of only published courses (courses available to learners)
  const { count: publishedCourses, error: publishedError } = await supabase
    .from('published_courses')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  if (publishedError) {
    return {
      success: false,
      message: `Failed to fetch published courses: ${publishedError.message}`,
      data: null,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // FETCH LAST MONTH'S PUBLISHED COURSES
  // ═══════════════════════════════════════════════════════════════
  // Count published courses created in the previous month
  // Used as baseline for calculating growth percentage
  const { count: lastMonthPublished, error: lastMonthError } = await supabase
    .from('published_courses')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', startOfLastMonth.toISOString())
    .lte('created_at', endOfLastMonth.toISOString());

  if (lastMonthError) {
    return {
      success: false,
      message: `Failed to fetch last month published courses: ${lastMonthError.message}`,
      data: null,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // FETCH THIS MONTH'S PUBLISHED COURSES
  // ═══════════════════════════════════════════════════════════════
  // Count published courses created in the current month
  // Used to compare against last month for growth calculation
  const { count: thisMonthPublished, error: thisMonthError } = await supabase
    .from('published_courses')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', startOfThisMonth.toISOString());

  if (thisMonthError) {
    return {
      success: false,
      message: `Failed to fetch this month published courses: ${thisMonthError.message}`,
      data: null,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // CALCULATE METRICS
  // ═══════════════════════════════════════════════════════════════

  // Calculate unpublished courses (draft or in-progress courses)
  const unpublished = (totalCourses ?? 0) - (publishedCourses ?? 0);

  // Calculate month-over-month growth for published courses
  // Growth = ((This Month - Last Month) / Last Month) × 100
  // Special cases:
  // - If last month had 0 courses but this month has some: 100% growth
  // - If both months have 0 courses: 0% growth
  const lastMonthCount = lastMonthPublished ?? 0;
  const thisMonthCount = thisMonthPublished ?? 0;

  let percentGrowth: number;
  if (lastMonthCount > 0) {
    // Standard growth calculation
    percentGrowth = ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
  } else if (thisMonthCount > 0) {
    // First published courses this month - show 100% growth
    percentGrowth = 100;
  } else {
    // No courses in either month - 0% growth
    percentGrowth = 0;
  }

  // ═══════════════════════════════════════════════════════════════
  // RETURN RESULTS
  // ═══════════════════════════════════════════════════════════════
  return {
    success: true,
    message: 'Successfully fetched course statistics',
    data: {
      total_courses: totalCourses ?? 0,
      published_courses: publishedCourses ?? 0,
      unpublished_courses: unpublished < 0 ? 0 : unpublished,
      percent_growth: Number(percentGrowth.toFixed(2)),
    },
  };
}

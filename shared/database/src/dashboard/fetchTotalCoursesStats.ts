import type { TypedSupabaseClient } from '../client';

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

export async function fetchTotalCoursesStats({
  supabase,
  organizationId,
}: FetchTotalCoursesStatsArgs): Promise<Result<CourseStats>> {
  // Get date boundaries for this month and last month
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // 1️⃣ Fetch total courses for the organization
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

  // 2️⃣ Fetch published courses count
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

  // 3️⃣ Count total courses created last month and this month
  const { count: lastMonthCount, error: lastMonthError } = await supabase
    .from('courses')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', startOfLastMonth.toISOString())
    .lte('created_at', endOfLastMonth.toISOString());

  if (lastMonthError) {
    return {
      success: false,
      message: `Failed to fetch last month courses: ${lastMonthError.message}`,
      data: null,
    };
  }

  const { count: thisMonthCount, error: thisMonthError } = await supabase
    .from('courses')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', startOfThisMonth.toISOString());

  if (thisMonthError) {
    return {
      success: false,
      message: `Failed to fetch this month courses: ${thisMonthError.message}`,
      data: null,
    };
  }

  // 4️⃣ Compute unpublished & growth %
  const unpublished = (totalCourses ?? 0) - (publishedCourses ?? 0);
  const percentGrowth =
    lastMonthCount && lastMonthCount > 0
      ? (((thisMonthCount ?? 0) - lastMonthCount) / lastMonthCount) * 100
      : 100; // if last month was 0, treat as 100% growth

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

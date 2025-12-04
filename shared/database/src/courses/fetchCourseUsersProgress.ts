import type { TypedSupabaseClient } from '../client';

interface FetchCourseUsersProgressArgs {
  supabase: TypedSupabaseClient;
  publishedCourseId: string;
}

export interface UserProgressStats {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  progress_percentage: number;
  average_score: number;
  completed_blocks: number;
  total_blocks: number;
  completed_lessons: number;
  total_lessons: number;
  is_completed: boolean;
  last_activity: string;
  time_spent_seconds: number;
  reset_count: number;
}

/**
 * Fetches progress statistics for all enrolled users in a published course.
 * Includes completion percentage, average score, and activity metrics.
 */
export async function fetchCourseUsersProgress({
  supabase,
  publishedCourseId,
}: FetchCourseUsersProgressArgs): Promise<UserProgressStats[]> {
  // First, get all enrolled users
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('course_enrollments')
    .select('user_id')
    .eq('published_course_id', publishedCourseId)
    .eq('is_active', true);

  if (enrollmentError) {
    console.error('Failed to fetch enrolled users:', enrollmentError);
    return [];
  }

  if (!enrollments || enrollments.length === 0) {
    return [];
  }

  const userIds = enrollments.map((e) => e.user_id);

  // Fetch course progress for all enrolled users with user profile info
  const { data: courseProgress, error: progressError } = await supabase
    .from('course_progress')
    .select(
      `
      user_id,
      progress_percentage,
      completed_blocks,
      total_blocks,
      completed_lessons,
      total_lessons,
      is_completed,
      updated_at,
      profiles:user_id (
        username,
        full_name,
        avatar_url
      )
    `,
    )
    .eq('published_course_id', publishedCourseId)
    .in('user_id', userIds);

  if (progressError) {
    console.error('Failed to fetch course progress:', progressError);
    return [];
  }

  // Fetch block progress to calculate average scores and time spent
  const { data: blockProgress, error: blockError } = await supabase
    .from('block_progress')
    .select(
      `
      user_id,
      earned_score,
      time_spent_seconds
    `,
    )
    .eq('published_course_id', publishedCourseId)
    .in('user_id', userIds);

  if (blockError) {
    console.error('Failed to fetch block progress:', blockError);
    return [];
  }

  // Fetch lesson reset counts to track how many times users have reset lessons
  const { data: lessonResets, error: resetsError } = await supabase
    .from('lesson_reset_count')
    .select('user_id, reset_count')
    .eq('published_course_id', publishedCourseId)
    .in('user_id', userIds);

  if (resetsError) {
    console.error('Failed to fetch lesson reset counts:', resetsError);
  }

  // Sum up total reset counts per user across all lessons
  const userResetCounts = lessonResets?.reduce(
    (acc, reset) => {
      acc[reset.user_id] = (acc[reset.user_id] || 0) + reset.reset_count;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Calculate average scores and total time per user
  const userScores = blockProgress?.reduce(
    (acc, block) => {
      if (!acc[block.user_id]) {
        acc[block.user_id] = {
          totalScore: 0,
          scoreCount: 0,
          totalTime: 0,
        };
      }

      const userScore = acc[block.user_id]!;

      if (block.earned_score !== null && block.earned_score !== undefined) {
        userScore.totalScore += block.earned_score;
        userScore.scoreCount += 1;
      }

      userScore.totalTime += block.time_spent_seconds || 0;

      return acc;
    },
    {} as Record<
      string,
      {
        totalScore: number;
        scoreCount: number;
        totalTime: number;
      }
    >,
  );

  // Combine all data
  const usersProgress: UserProgressStats[] = (courseProgress || []).map((progress) => {
    const scores = userScores?.[progress.user_id];
    const averageScore =
      scores && scores.scoreCount > 0 ? scores.totalScore / scores.scoreCount : 0;
    const timeSpent = scores?.totalTime || 0;

    // Extract profile data (profiles is returned as an object, not array)
    const profile = progress.profiles as any;

    // Get total reset count for this user across all lessons
    const resetCount = userResetCounts?.[progress.user_id] || 0;

    return {
      user_id: progress.user_id,
      username: profile?.username || null,
      full_name: profile?.full_name || null,
      avatar_url: profile?.avatar_url || null,
      progress_percentage: progress.progress_percentage || 0,
      average_score: Math.round(averageScore * 100) / 100, // Round to 2 decimal places
      completed_blocks: progress.completed_blocks,
      total_blocks: progress.total_blocks,
      completed_lessons: progress.completed_lessons,
      total_lessons: progress.total_lessons,
      is_completed: progress.is_completed,
      last_activity: progress.updated_at,
      time_spent_seconds: timeSpent,
      reset_count: resetCount,
    };
  });

  // Sort by progress percentage (descending)
  return usersProgress.sort((a, b) => b.progress_percentage - a.progress_percentage);
}

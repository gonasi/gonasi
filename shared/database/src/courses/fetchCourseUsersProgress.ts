import { getSignedUrl } from '@gonasi/cloudinary';

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
  signed_url: string | undefined;
  progress_percentage: number;
  average_score: number;
  completed_blocks: number;
  total_blocks: number;
  completed_lessons: number;
  total_lessons: number;
  is_completed: boolean;
  last_activity: string | null;
  enrolled_at: string;
  time_spent_seconds: number;
  reset_count: number;
}

/**
 * Fetches progress statistics for the last 5 active users in a published course.
 * Returns users sorted by recent activity (most recent first) with signed avatar URLs.
 * Includes completion percentage, average score, and activity metrics.
 * Returns enrolled users even if they have no progress data yet (e.g., after course republish).
 */
export async function fetchCourseUsersProgress({
  supabase,
  publishedCourseId,
}: FetchCourseUsersProgressArgs): Promise<UserProgressStats[]> {
  // First, get all enrolled users with enrollment date
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('course_enrollments')
    .select('user_id, created_at')
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

  // Fetch profiles for all enrolled users
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, updated_at')
    .in('id', userIds);

  if (profilesError) {
    console.error('Failed to fetch profiles:', profilesError);
  }

  // Create a map of profiles for quick lookup
  const profilesMap = profiles?.reduce(
    (acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    },
    {} as Record<string, any>,
  );

  // Fetch course progress for all enrolled users
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
      updated_at
    `,
    )
    .eq('published_course_id', publishedCourseId)
    .in('user_id', userIds);

  if (progressError) {
    console.error('Failed to fetch course progress:', progressError);
  }

  // Create a map of course progress for quick lookup
  const progressMap = courseProgress?.reduce(
    (acc, progress) => {
      acc[progress.user_id] = progress;
      return acc;
    },
    {} as Record<string, any>,
  );

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

  // Combine all data - map through enrollments to include users without progress
  const usersProgress: UserProgressStats[] = enrollments.map((enrollment) => {
    const userId = enrollment.user_id;
    const progress = progressMap?.[userId];
    const profile = profilesMap?.[userId];
    const scores = userScores?.[userId];
    const resetCount = userResetCounts?.[userId] || 0;

    const averageScore =
      scores && scores.scoreCount > 0 ? scores.totalScore / scores.scoreCount : 0;
    const timeSpent = scores?.totalTime || 0;

    // Generate signed URL for avatar if it exists
    let signedUrl: string | undefined;
    if (profile?.avatar_url) {
      // Use profile updated_at timestamp as version for cache busting
      const version = profile.updated_at ? new Date(profile.updated_at).getTime() : undefined;

      signedUrl = getSignedUrl(profile.avatar_url, {
        width: 400,
        height: 400,
        quality: 'auto',
        format: 'auto',
        expiresInSeconds: 3600,
        resourceType: 'image',
        version,
      });
    }

    return {
      user_id: userId,
      username: profile?.username || null,
      full_name: profile?.full_name || null,
      avatar_url: profile?.avatar_url || null,
      signed_url: signedUrl,
      progress_percentage: progress?.progress_percentage || 0,
      average_score: Math.round(averageScore * 100) / 100, // Round to 2 decimal places
      completed_blocks: progress?.completed_blocks || 0,
      total_blocks: progress?.total_blocks || 0,
      completed_lessons: progress?.completed_lessons || 0,
      total_lessons: progress?.total_lessons || 0,
      is_completed: progress?.is_completed || false,
      last_activity: progress?.updated_at || null,
      enrolled_at: enrollment.created_at,
      time_spent_seconds: timeSpent,
      reset_count: resetCount,
    };
  });

  console.log(usersProgress);

  // Sort by recent activity (descending), fallback to enrollment date, and limit to 5 users
  return usersProgress
    .sort((a, b) => {
      const aTime = a.last_activity
        ? new Date(a.last_activity).getTime()
        : new Date(a.enrolled_at).getTime();
      const bTime = b.last_activity
        ? new Date(b.last_activity).getTime()
        : new Date(b.enrolled_at).getTime();
      return bTime - aTime;
    })
    .slice(0, 5);
}

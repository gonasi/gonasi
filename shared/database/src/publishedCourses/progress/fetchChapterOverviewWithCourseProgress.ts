import { CourseStructureOverviewSchema } from '@gonasi/schemas/publish/courseStructure';

import { getUserId } from '../../auth';
import type { TypedSupabaseClient } from '../../client';

interface FetchChapterOverviewArgs {
  supabase: TypedSupabaseClient;
  courseId: string;
  chapterId: string;
}

export async function fetchChapterOverviewWithCourseProgress({
  supabase,
  courseId,
  chapterId,
}: FetchChapterOverviewArgs) {
  const userId = await getUserId(supabase);

  // Fetch course structure
  const { data: courseData, error: courseError } = await supabase
    .from('published_courses')
    .select('id, course_structure_overview')
    .eq('id', courseId)
    .single();

  if (courseError || !courseData) {
    console.error('Error fetching course structure:', courseError);
    return null;
  }

  // Parse structure using Zod schema
  const parsed = CourseStructureOverviewSchema.safeParse(courseData.course_structure_overview);
  if (!parsed.success) {
    console.error('Invalid course structure:', parsed.error.format());
    return null;
  }

  // Find chapter
  const chapter = parsed.data.chapters.find((c) => c.id === chapterId);
  if (!chapter) {
    console.warn(`Chapter with id ${chapterId} not found in course structure.`);
    return null;
  }

  // Fetch progress
  const { data: progressData, error: progressError } = await supabase
    .from('course_progress')
    .select()
    .eq('published_course_id', courseId)
    .eq('user_id', userId)
    .single();

  if (progressError) {
    console.error('Error fetching chapter progress:', progressError);
    return null;
  }

  return {
    chapter,
    progress: progressData,
  };
}

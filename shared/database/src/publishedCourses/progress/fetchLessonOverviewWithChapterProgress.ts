import { CourseStructureOverviewSchema } from '@gonasi/schemas/publish/courseStructure';

import type { TypedSupabaseClient } from '../../client';

interface FetchLessonOverviewArgs {
  supabase: TypedSupabaseClient;
  courseId: string;
  lessonId: string;
}

export async function fetchLessonOverviewWithChapterProgress({
  supabase,
  courseId,
  lessonId,
}: FetchLessonOverviewArgs) {
  const { data, error } = await supabase
    .from('published_courses')
    .select(
      `
        id,
        course_structure_overview,
        chapter_progress (
          chapter_id,
          progress_percentage,
          total_lessons,
          completed_lessons
        )
      `,
    )
    .eq('id', courseId)
    .single();

  if (error) {
    console.error('Error fetching course structure:', error);
    return null;
  }

  const parseResult = CourseStructureOverviewSchema.safeParse(data?.course_structure_overview);

  if (!parseResult.success) {
    console.error('Invalid course structure:', parseResult.error.format());
    return null;
  }

  const { chapters } = parseResult.data;

  for (const chapter of chapters) {
    const lesson = chapter.lessons.find((l) => l.id === lessonId);
    if (lesson) {
      const chapterProgress =
        data.chapter_progress?.find((p) => p.chapter_id === chapter.id) ?? null;

      return {
        chapter,
        lesson,
        progress: chapterProgress,
      };
    }
  }

  console.error(`Lesson with id ${lessonId} not found`);
  return null;
}

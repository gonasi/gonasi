import { CourseStructureOverviewSchema } from '@gonasi/schemas/publish/courseStructure';
import {
  type FetchLessonOverviewWithChapterProgressArgs,
  type LessonOverviewChapterProgress,
  type LessonOverviewWithChapterProgressResult,
  validateLessonOverviewChapterProgress,
  validateLessonOverviewCourseProgress,
  validateLessonOverviewLessonProgress,
} from '@gonasi/schemas/publish/progress-complete';

import { getUserId } from '../../auth';

export async function fetchLessonOverviewWithChapterProgress({
  supabase,
  courseId,
  lessonId,
}: FetchLessonOverviewWithChapterProgressArgs): Promise<LessonOverviewWithChapterProgressResult | null> {
  const userId = await getUserId(supabase);

  // Fetch course structure and all progress data in parallel
  const [courseResult, chapterProgressResult, lessonProgressResult, courseProgressResult] =
    await Promise.all([
      // 1. Fetch course structure
      supabase
        .from('published_courses')
        .select('id, course_structure_overview')
        .eq('id', courseId)
        .single(),

      // 2. Fetch all chapter progress for this user and course
      supabase
        .from('chapter_progress')
        .select(
          `
        chapter_id,
        progress_percentage,
        total_lessons,
        completed_lessons,
        total_blocks,
        completed_blocks,
        is_completed,
        total_weight,
        completed_weight,
        lesson_progress_percentage
      `,
        )
        .eq('user_id', userId)
        .eq('published_course_id', courseId),

      // 3. Fetch lesson progress for this specific lesson
      supabase
        .from('lesson_progress')
        .select(
          `
        lesson_id,
        progress_percentage,
        total_blocks,
        completed_blocks,
        is_completed,
        total_weight,
        completed_weight
      `,
        )
        .eq('user_id', userId)
        .eq('published_course_id', courseId)
        .eq('lesson_id', lessonId)
        .single(),

      // 4. Fetch overall course progress
      supabase
        .from('course_progress')
        .select(
          `
        progress_percentage,
        total_chapters,
        completed_chapters,
        total_lessons,
        completed_lessons,
        total_blocks,
        completed_blocks,
        is_completed,
        lesson_progress_percentage
      `,
        )
        .eq('user_id', userId)
        .eq('published_course_id', courseId)
        .single(),
    ]);

  // Handle course structure fetch error
  if (courseResult.error) {
    console.error('Error fetching course structure:', courseResult.error);
    return null;
  }

  // Parse and validate course structure
  const parseResult = CourseStructureOverviewSchema.safeParse(
    courseResult.data?.course_structure_overview,
  );
  if (!parseResult.success || !parseResult.data) {
    console.error('Invalid course structure:', parseResult.error?.format() || 'No data returned');
    return null;
  }

  const courseStructure = parseResult.data;
  const chapters = courseStructure.chapters;

  // Additional safety check for chapters array
  if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
    console.error('No chapters found in course structure');
    return null;
  }

  // Find the chapter and lesson
  let foundChapter = null;
  let foundLesson = null;

  for (const chapter of chapters) {
    const lesson = chapter.lessons.find((l) => l.id === lessonId);
    if (lesson) {
      foundChapter = chapter;
      foundLesson = lesson;
      break;
    }
  }

  if (!foundChapter || !foundLesson) {
    console.error(`Lesson with id ${lessonId} not found`);
    return null;
  }

  // Get progress data (handle potential errors gracefully with validation)
  const chapterProgressData = chapterProgressResult.error
    ? []
    : (chapterProgressResult.data
        .map(validateLessonOverviewChapterProgress)
        .filter(Boolean) as LessonOverviewChapterProgress[]);

  const lessonProgressData = lessonProgressResult.error
    ? null
    : validateLessonOverviewLessonProgress(lessonProgressResult.data);

  const courseProgressData = courseProgressResult.error
    ? null
    : validateLessonOverviewCourseProgress(courseProgressResult.data);

  // Find the specific chapter progress
  const currentChapterProgress =
    chapterProgressData.find(
      (p: LessonOverviewChapterProgress) => p.chapter_id === foundChapter.id,
    ) ?? null;

  // Calculate lesson position within chapter
  const lessonPositionInChapter = foundChapter.lessons.findIndex((l) => l.id === lessonId) + 1;
  const totalLessonsInChapter = foundChapter.lessons.length;

  // Calculate chapter position within course
  const chapterPositionInCourse = chapters.findIndex((c) => c.id === foundChapter.id) + 1;
  const totalChaptersInCourse = chapters.length;

  // Calculate completed lessons in current chapter (up to current lesson)
  const completedLessonsInChapter = currentChapterProgress?.completed_lessons ?? 0;

  // Calculate completed chapters in course (before current chapter)
  const completedChaptersBefore = chapterProgressData.filter((p: LessonOverviewChapterProgress) => {
    const chapterIndex = chapters.findIndex((c) => c.id === p.chapter_id);
    const currentChapterIndex = chapters.findIndex((c) => c.id === foundChapter.id);
    return chapterIndex < currentChapterIndex && p.is_completed;
  }).length;

  // Calculate total completed lessons across the entire course
  const totalCompletedLessonsInCourse = courseProgressData?.completed_lessons ?? 0;
  const totalLessonsInCourse = courseProgressData?.total_lessons ?? courseStructure.total_lessons;

  // Calculate lesson position in entire course
  let lessonPositionInCourse = 0;
  let lessonsBeforeCurrentChapter = 0;

  for (let i = 0; i < chapters.length; i++) {
    if (chapters[i]?.id === foundChapter?.id) {
      lessonPositionInCourse = lessonsBeforeCurrentChapter + lessonPositionInChapter;
      break;
    }
    lessonsBeforeCurrentChapter += chapters[i]?.lessons?.length ?? 0;
  }

  return {
    // Core entities
    chapter: foundChapter,
    lesson: foundLesson,

    // Progress information
    progress: {
      // Chapter-specific progress
      chapter: currentChapterProgress,

      // Lesson-specific progress
      lesson: lessonProgressData,

      // Course-wide progress context
      course: courseProgressData,

      // Positional context with counts
      position: {
        // Lesson position within current chapter
        lessonInChapter: lessonPositionInChapter,
        totalLessonsInChapter,
        lessonInChapterText: `${lessonPositionInChapter} of ${totalLessonsInChapter}`,

        // Chapter position within course
        chapterInCourse: chapterPositionInCourse,
        totalChaptersInCourse,
        chapterInCourseText: `${chapterPositionInCourse} of ${totalChaptersInCourse}`,

        // Lesson position within entire course
        lessonInCourse: lessonPositionInCourse,
        totalLessonsInCourse,
        lessonInCourseText: `${lessonPositionInCourse} of ${totalLessonsInCourse}`,
      },

      // Completion counts
      counts: {
        // Chapter-level completion
        completedLessonsInChapter,
        remainingLessonsInChapter: totalLessonsInChapter - completedLessonsInChapter,
        completedLessonsInChapterText: `${completedLessonsInChapter} of ${totalLessonsInChapter} completed`,

        // Course-level completion
        completedChaptersBefore,
        remainingChapters:
          totalChaptersInCourse -
          (completedChaptersBefore + (currentChapterProgress?.is_completed ? 1 : 0)),
        completedChaptersText: `${completedChaptersBefore + (currentChapterProgress?.is_completed ? 1 : 0)} of ${totalChaptersInCourse} completed`,

        // Overall lesson completion
        totalCompletedLessonsInCourse,
        remainingLessonsInCourse: totalLessonsInCourse - totalCompletedLessonsInCourse,
        completedLessonsInCourseText: `${totalCompletedLessonsInCourse} of ${totalLessonsInCourse} completed`,
      },

      // All chapter progress (useful for navigation/overview)
      allChapterProgress: chapterProgressData,
    },
  };
}

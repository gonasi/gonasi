import { z } from 'zod';

// Base progress schemas with LessonOverview prefix
export const LessonOverviewChapterProgressSchema = z.object({
  chapter_id: z.string().uuid(),
  progress_percentage: z.number().min(0).max(100),
  total_lessons: z.number().int().min(0),
  completed_lessons: z.number().int().min(0),
  total_blocks: z.number().int().min(0),
  completed_blocks: z.number().int().min(0),
  is_completed: z.boolean(),
  total_weight: z.number().min(0),
  completed_weight: z.number().min(0),
  lesson_progress_percentage: z.number().min(0).max(100),
});

export const LessonOverviewLessonProgressSchema = z.object({
  lesson_id: z.string().uuid(),
  progress_percentage: z.number().min(0).max(100),
  total_blocks: z.number().int().min(0),
  completed_blocks: z.number().int().min(0),
  is_completed: z.boolean(),
  total_weight: z.number().min(0),
  completed_weight: z.number().min(0),
});

export const LessonOverviewCourseProgressSchema = z.object({
  progress_percentage: z.number().min(0).max(100),
  total_chapters: z.number().int().min(0),
  completed_chapters: z.number().int().min(0),
  total_lessons: z.number().int().min(0),
  completed_lessons: z.number().int().min(0),
  total_blocks: z.number().int().min(0),
  completed_blocks: z.number().int().min(0),
  is_completed: z.boolean(),
  lesson_progress_percentage: z.number().min(0).max(100),
});

// Position and count schemas with LessonOverview prefix
export const LessonOverviewPositionContextSchema = z.object({
  // Lesson position within current chapter
  lessonInChapter: z.number().int().min(1),
  totalLessonsInChapter: z.number().int().min(1),
  lessonInChapterText: z.string(),

  // Chapter position within course
  chapterInCourse: z.number().int().min(1),
  totalChaptersInCourse: z.number().int().min(1),
  chapterInCourseText: z.string(),

  // Lesson position within entire course
  lessonInCourse: z.number().int().min(1),
  totalLessonsInCourse: z.number().int().min(1),
  lessonInCourseText: z.string(),
});

export const LessonOverviewCompletionCountsSchema = z.object({
  // Chapter-level completion
  completedLessonsInChapter: z.number().int().min(0),
  remainingLessonsInChapter: z.number().int().min(0),
  completedLessonsInChapterText: z.string(),

  // Course-level completion
  completedChaptersBefore: z.number().int().min(0),
  remainingChapters: z.number().int().min(0),
  completedChaptersText: z.string(),

  // Overall lesson completion
  totalCompletedLessonsInCourse: z.number().int().min(0),
  remainingLessonsInCourse: z.number().int().min(0),
  completedLessonsInCourseText: z.string(),
});

// Comprehensive progress schema with prefix
export const LessonOverviewProgressDataSchema = z.object({
  // Individual progress records (nullable if not found)
  chapter: LessonOverviewChapterProgressSchema.nullable(),
  lesson: LessonOverviewLessonProgressSchema.nullable(),
  course: LessonOverviewCourseProgressSchema.nullable(),

  // Positional context
  position: LessonOverviewPositionContextSchema,

  // Completion counts
  counts: LessonOverviewCompletionCountsSchema,

  // All chapter progress for navigation
  allChapterProgress: z.array(LessonOverviewChapterProgressSchema),
});

// Main function return schema with prefix
export const LessonOverviewWithChapterProgressResultSchema = z.object({
  // Core entities (from CourseStructureOverviewSchema)
  chapter: z.object({
    id: z.string().uuid(),
    course_id: z.string().uuid(),
    lesson_count: z.number().int().min(0),
    name: z.string().min(1),
    description: z.string().min(1),
    position: z.number().int().min(0),
    total_lessons: z.number().int().min(1),
    total_blocks: z.number().int().min(1),
    lessons: z.array(
      z.object({
        id: z.string().uuid(),
        course_id: z.string().uuid(),
        chapter_id: z.string().uuid(),
        lesson_type_id: z.string().uuid(),
        name: z.string().min(1),
        position: z.number().int().min(0),
        total_blocks: z.number().int().min(1),
        lesson_types: z.object({
          id: z.string().uuid(),
          name: z.string(),
          description: z.string(),
          lucide_icon: z.string(),
          bg_color: z.string(),
        }),
      }),
    ),
  }),

  lesson: z.object({
    id: z.string().uuid(),
    course_id: z.string().uuid(),
    chapter_id: z.string().uuid(),
    lesson_type_id: z.string().uuid(),
    name: z.string().min(1),
    position: z.number().int().min(0),
    total_blocks: z.number().int().min(1),
    lesson_types: z.object({
      id: z.string().uuid(),
      name: z.string(),
      description: z.string(),
      lucide_icon: z.string(),
      bg_color: z.string(),
    }),
  }),

  // Comprehensive progress information
  progress: LessonOverviewProgressDataSchema,
});

// Function arguments schema with prefix
export const FetchLessonOverviewWithChapterProgressArgsSchema = z.object({
  supabase: z.any(), // TypedSupabaseClient is complex, so we use z.any()
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
});

// Export inferred types with prefixed names
export type LessonOverviewChapterProgress = z.infer<typeof LessonOverviewChapterProgressSchema>;
export type LessonOverviewLessonProgress = z.infer<typeof LessonOverviewLessonProgressSchema>;
export type LessonOverviewCourseProgress = z.infer<typeof LessonOverviewCourseProgressSchema>;
export type LessonOverviewPositionContext = z.infer<typeof LessonOverviewPositionContextSchema>;
export type LessonOverviewCompletionCounts = z.infer<typeof LessonOverviewCompletionCountsSchema>;
export type LessonOverviewProgressData = z.infer<typeof LessonOverviewProgressDataSchema>;
export type LessonOverviewWithChapterProgressResult = z.infer<
  typeof LessonOverviewWithChapterProgressResultSchema
>;
export type FetchLessonOverviewWithChapterProgressArgs = z.infer<
  typeof FetchLessonOverviewWithChapterProgressArgsSchema
>;

// Validation helper functions with prefixed names
export const validateLessonOverviewChapterProgress = (
  data: unknown,
): LessonOverviewChapterProgress | null => {
  const result = LessonOverviewChapterProgressSchema.safeParse(data);
  return result.success ? result.data : null;
};

export const validateLessonOverviewLessonProgress = (
  data: unknown,
): LessonOverviewLessonProgress | null => {
  const result = LessonOverviewLessonProgressSchema.safeParse(data);
  return result.success ? result.data : null;
};

export const validateLessonOverviewCourseProgress = (
  data: unknown,
): LessonOverviewCourseProgress | null => {
  const result = LessonOverviewCourseProgressSchema.safeParse(data);
  return result.success ? result.data : null;
};

export const validateLessonOverviewWithChapterProgressResult = (
  data: unknown,
): LessonOverviewWithChapterProgressResult | null => {
  const result = LessonOverviewWithChapterProgressResultSchema.safeParse(data);
  if (!result.success) {
    console.error('Lesson overview validation failed:', result.error.format());
    return null;
  }
  return result.data;
};

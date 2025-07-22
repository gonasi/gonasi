import { z } from 'zod';

export const LessonMetadataSchema = z.object({
  lesson_id: z.string().uuid(),
  chapter_id: z.string().uuid(),
  course_id: z.string().uuid(),
});

export const CurrentLessonSchema = LessonMetadataSchema.extend({
  is_complete: z.boolean(),
  progress_percentage: z.number(),
});

export const ContinueLessonSchema = LessonMetadataSchema.extend({
  is_different_from_next: z.boolean(),
});

export const LessonNavigationResponseSchema = z.object({
  current_lesson: CurrentLessonSchema,
  previous_lesson: LessonMetadataSchema.nullable(),
  next_lesson: LessonMetadataSchema.nullable(),
  continue_course: ContinueLessonSchema.nullable(),
  course_info: z.object({
    course_id: z.string().uuid(),
    total_lessons: z.number(),
    completed_lessons: z.number(),
    is_course_complete: z.boolean(),
  }),
});

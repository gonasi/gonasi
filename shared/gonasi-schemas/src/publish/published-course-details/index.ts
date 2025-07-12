import { z } from 'zod';

import { LessonTypeSchema } from '..';
import { PublishedCourseSchema } from '../published-course';

// Reuse lesson schema but without blocks array
const CourseDetailsLessonSchema = z.object({
  id: z.string(),
  course_id: z.string(),
  chapter_id: z.string(),
  lesson_type_id: z.string(),
  name: z.string().nonempty(),
  position: z.number().int().nonnegative(),
  settings: z.any(),
  lesson_types: LessonTypeSchema,
  total_blocks: z.number().int().nonnegative(),
});

// Reuse chapter schema but with lessons that don't include blocks
const CourseDetailsChapterSchema = z.object({
  id: z.string(),
  course_id: z.string(),
  lesson_count: z.number().int().nonnegative(),
  name: z.string().nonempty(),
  description: z.string().nonempty(),
  position: z.number().int().nonnegative(),
  total_lessons: z.number().int().nonnegative(),
  total_blocks: z.number().int().nonnegative(),
  lessons: z.array(CourseDetailsLessonSchema),
});

export const PublishedCourseDetailsSchema = PublishedCourseSchema.extend({
  // Add course structure with chapters and lessons (no blocks)
  course_structure: z.object({
    total_chapters: z.number().int().nonnegative(),
    total_lessons: z.number().int().nonnegative(),
    total_blocks: z.number().int().nonnegative(),
    chapters: z.array(CourseDetailsChapterSchema),
  }),
}).omit({
  // Remove these fields since they're now in course_structure
  total_chapters: true,
  total_lessons: true,
  total_blocks: true,
});

export type PublishedCourseDetails = z.infer<typeof PublishedCourseDetailsSchema>;

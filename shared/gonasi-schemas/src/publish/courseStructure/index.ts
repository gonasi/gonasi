import { z } from 'zod';

import { LessonTypeSchema, PublishedLessonSchema } from '../base';

// Chapter schema with full lesson data
const ChapterSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  name: z.string().nonempty(),
  description: z.string().nonempty(),
  position: z.number().int().nonnegative(),
  lesson_count: z.number().int().nonnegative(),
  total_lessons: z.number().int().positive(),
  total_blocks: z.number().int().positive(),
  lessons: z.array(PublishedLessonSchema),
});

// Course structure content schema (includes all fields)
export const CourseStructureContentSchema = z.object({
  total_chapters: z.number().int().positive(),
  total_lessons: z.number().int().positive(),
  total_blocks: z.number().int().positive(),
  chapters: z.array(ChapterSchema),
});

// Lesson overview schema (excludes settings and blocks from lessons)
const LessonOverviewSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  chapter_id: z.string().uuid(),
  lesson_type_id: z.string().uuid(),
  name: z.string().nonempty(),
  position: z.number().int().nonnegative(),
  total_blocks: z.number().int().positive(),
  lesson_types: LessonTypeSchema,
});

// Chapter overview schema (with lesson overviews)
const ChapterOverviewSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  name: z.string().nonempty(),
  description: z.string().nonempty(),
  position: z.number().int().nonnegative(),
  lesson_count: z.number().int().nonnegative(),
  total_lessons: z.number().int().positive(),
  total_blocks: z.number().int().positive(),
  lessons: z.array(LessonOverviewSchema),
});

// Course structure overview schema (excludes settings and blocks from lessons)
export const CourseStructureOverviewSchema = z.object({
  total_chapters: z.number().int().positive(),
  total_lessons: z.number().int().positive(),
  total_blocks: z.number().int().positive(),
  chapters: z.array(ChapterOverviewSchema),
});

export type CourseStructureContentSchemaTypes = z.infer<typeof CourseStructureContentSchema>;
export type CourseStructureOverviewSchemaTypes = z.infer<typeof CourseStructureOverviewSchema>;

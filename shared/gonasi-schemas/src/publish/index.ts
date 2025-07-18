import { z } from 'zod';

import { RichTextSchema } from '../plugins';

export const LessonTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  lucide_icon: z.string(),
  bg_color: z.string(),
});

// Published blocks schemas
const PublishRichTextSchema = RichTextSchema.extend({
  id: z.string(),
  position: z.number().int().nonnegative(),
});

export const PublishBlockSchema = z.discriminatedUnion('plugin_type', [PublishRichTextSchema]);
export type PublishBlockSchemaTypes = z.infer<typeof PublishBlockSchema>;

export const PublishedLessonSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  chapter_id: z.string().uuid(),
  lesson_type_id: z.string().uuid(),
  name: z.string().nonempty(),
  position: z.number().int().nonnegative(),
  settings: z.any(),
  total_blocks: z.number().int().positive(),
  lesson_types: LessonTypeSchema,
  blocks: z.array(PublishBlockSchema),
});
export type PublishedLessonSchemaTypes = z.infer<typeof PublishedLessonSchema>;
export type PublishedLessonBlocksArrayType = PublishedLessonSchemaTypes['blocks'];

export const LessonProgressSchema = z.object({
  total_blocks: z.number().int().nonnegative(),
  average_score: z.number().nullable(),
  completed_blocks: z.number().int().nonnegative(),
  total_time_spent: z.number().int().nonnegative(),
  last_completed_at: z.string().datetime().nullable(),
  is_fully_completed: z.boolean(),
  completion_percentage: z.number().min(0).max(100),
  suggested_next_block_id: z.string().uuid().nullable(),
  next_incomplete_block_id: z.string().uuid().nullable(),
});

export const PublishedLessonWithProgressSchema = PublishedLessonSchema.extend({
  lesson_progress: LessonProgressSchema,
});

export type PublishedLessonWithProgressSchemaTypes = z.infer<
  typeof PublishedLessonWithProgressSchema
>;

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

// New schema for course_structure_content (includes all fields)
export const CourseStructureContentSchema = z.object({
  total_chapters: z.number().int().positive(),
  total_lessons: z.number().int().positive(),
  total_blocks: z.number().int().positive(),
  chapters: z.array(ChapterSchema),
});
export type CourseStructureContentSchemaTypes = z.infer<typeof CourseStructureContentSchema>;

// New schema for course_structure_overview (excludes settings and blocks from lessons)
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

export const CourseStructureOverviewSchema = z.object({
  total_chapters: z.number().int().positive(),
  total_lessons: z.number().int().positive(),
  total_blocks: z.number().int().positive(),
  chapters: z.array(ChapterOverviewSchema),
});
export type CourseStructureOverviewSchemaTypes = z.infer<typeof CourseStructureOverviewSchema>;

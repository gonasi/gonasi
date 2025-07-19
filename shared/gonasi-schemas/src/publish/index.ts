import { z } from 'zod';

import { RichTextSchema } from '../plugins';

// -----------------------------------------------------------------------------
// Lesson Type Info
// -----------------------------------------------------------------------------
export const LessonTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  lucide_icon: z.string(),
  bg_color: z.string(),
});

// -----------------------------------------------------------------------------
// Block-Level Progress Schema
// -----------------------------------------------------------------------------
export const BlockProgressSchema = z.object({
  is_completed: z.boolean(),
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  time_spent_seconds: z.number().int().nullable(),
  score: z.number().nullable(),
  attempts: z.number().int(),
  state: z.any().nullable(),
  last_response: z.any().nullable(),
  feedback: z.string().nullable(),
});
export type BlockProgressSchemaTypes = z.infer<typeof BlockProgressSchema>;

// -----------------------------------------------------------------------------
// Published Block Schema (No Progress)
// -----------------------------------------------------------------------------
const PublishRichTextSchema = RichTextSchema.extend({
  id: z.string(),
  position: z.number().int().nonnegative(),
});

export const PublishBlockSchema = z.discriminatedUnion('plugin_type', [PublishRichTextSchema]);
export type PublishBlockSchemaTypes = z.infer<typeof PublishBlockSchema>;

// -----------------------------------------------------------------------------
// Published Block With Progress Schema (Flat, Not Nested)
// -----------------------------------------------------------------------------
const PublishRichTextWithProgressSchema = PublishRichTextSchema.extend({
  progress: BlockProgressSchema,
});

export const PublishBlockWithProgressSchema = z.discriminatedUnion('plugin_type', [
  PublishRichTextWithProgressSchema,
]);
export type PublishBlockWithProgressSchemaTypes = z.infer<typeof PublishBlockWithProgressSchema>;

// -----------------------------------------------------------------------------
// Published Lesson Schema (No Progress)
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// Lesson Progress Summary Schema
// -----------------------------------------------------------------------------
export const LessonProgressSchema = z.object({
  total_blocks: z.number().int().positive(),
  completed_blocks: z.number().int().nonnegative(),
  completion_percentage: z.number(),
  is_fully_completed: z.boolean(),
  total_time_spent: z.number().int(),
  average_score: z.number().nullable(),
  last_completed_at: z.string().datetime().nullable(),
  next_incomplete_block_id: z.string().uuid().nullable(),
  suggested_next_block_id: z.string().uuid().nullable(),
});
export type LessonProgressSchemaTypes = z.infer<typeof LessonProgressSchema>;

// -----------------------------------------------------------------------------
// Full Lesson With Progress Schema (Used for get_published_lesson_blocks_with_progress)
// -----------------------------------------------------------------------------
export const PublishedLessonWithProgressSchema = PublishedLessonSchema.extend({
  blocks: z.array(PublishBlockWithProgressSchema),
  lesson_progress: LessonProgressSchema,
});
export type PublishedLessonWithProgressSchemaTypes = z.infer<
  typeof PublishedLessonWithProgressSchema
>;

// -----------------------------------------------------------------------------
// Chapter Schema for course_structure_content
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// Full course_structure_content Schema
// -----------------------------------------------------------------------------
export const CourseStructureContentSchema = z.object({
  total_chapters: z.number().int().positive(),
  total_lessons: z.number().int().positive(),
  total_blocks: z.number().int().positive(),
  chapters: z.array(ChapterSchema),
});
export type CourseStructureContentSchemaTypes = z.infer<typeof CourseStructureContentSchema>;

// -----------------------------------------------------------------------------
// course_structure_overview Schema (excludes settings + blocks)
// -----------------------------------------------------------------------------
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

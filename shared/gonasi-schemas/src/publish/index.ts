import { z } from 'zod';

import { PricingSchema } from './course-pricing';

const JsonSchema = z.any();

export const LessonTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  lucide_icon: z.string(),
  bg_color: z.string(),
});

const BlockSchema = z.object({
  id: z.string(),
  lesson_id: z.string(),
  plugin_type: z.string(),
  content: JsonSchema,
  settings: JsonSchema,
  position: z.number().int().nonnegative(),
});

const LessonSchema = z.object({
  id: z.string(),
  course_id: z.string(),
  chapter_id: z.string(),
  lesson_type_id: z.string(),
  name: z.string().nonempty(),
  position: z.number().int().nonnegative(),
  settings: z.any(),
  lesson_types: LessonTypeSchema,

  total_blocks: z.number().int().positive(),
  blocks: z.array(BlockSchema),
});

const ChapterSchema = z.object({
  id: z.string(),
  course_id: z.string(),
  lesson_count: z.number().int().nonnegative(),
  name: z.string().nonempty(),
  description: z.string().nonempty(),
  position: z.number().int().nonnegative(),

  total_lessons: z.number().int().positive(),
  total_blocks: z.number().int().positive(),
  lessons: z.array(LessonSchema),
});

export const PublishCourseSchema = z.object({
  id: z.string(),
  organization_id: z.string(),

  category_id: z.string(),
  subcategory_id: z.string(),

  is_active: z.boolean(),
  name: z.string().nonempty(),
  description: z.string().nonempty(),
  image_url: z.string(),
  blur_hash: z.string().nullable(),
  visibility: z.enum(['public', 'private']),

  course_structure: z.object({
    total_chapters: z.number().int().positive(),
    total_lessons: z.number().int().positive(),
    total_blocks: z.number().int().positive(),
    chapters: z.array(ChapterSchema),
  }),

  pricing_tiers: PricingSchema,
});

export type PublishCourseSchemaTypes = z.infer<typeof PublishCourseSchema>;

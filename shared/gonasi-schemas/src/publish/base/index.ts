import { z } from 'zod';

import { PublishedBuilderSchema } from '../../plugins';

// Base lesson type schema
export const LessonTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  lucide_icon: z.string(),
  bg_color: z.string(),
});

// Base published lesson schema
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
  blocks: z.array(PublishedBuilderSchema),
});

export type PublishedLessonSchemaTypes = z.infer<typeof PublishedLessonSchema>;
export type PublishedLessonBlocksArrayType = PublishedLessonSchemaTypes['blocks'];

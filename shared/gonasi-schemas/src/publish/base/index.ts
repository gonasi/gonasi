import { z } from 'zod';

import { RichTextSchema } from '../../plugins';

// Base lesson type schema
export const LessonTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  lucide_icon: z.string(),
  bg_color: z.string(),
});

// Base published block schema
const PublishRichTextSchema = RichTextSchema.extend({
  id: z.string(),
  position: z.number().int().nonnegative(),
});

export const PublishBlockSchema = z.discriminatedUnion('plugin_type', [PublishRichTextSchema]);
export type PublishBlockSchemaTypes = z.infer<typeof PublishBlockSchema>;

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
  blocks: z.array(PublishBlockSchema),
});

export type PublishedLessonSchemaTypes = z.infer<typeof PublishedLessonSchema>;
export type PublishedLessonBlocksArrayType = PublishedLessonSchemaTypes['blocks'];

import { z } from 'zod';

import { PublishBlockSchema } from '../base';

export const LessonMetadataSchema = z.object({
  total_blocks: z.number(),
  average_score: z.number().nullable(),
  locked_blocks: z.number(),
  visible_blocks: z.number(),
  active_block_id: z.string().uuid(),
  available_blocks: z.number(),
  completed_blocks: z.number(),
  total_time_spent: z.number(),
  last_completed_at: z.string().datetime().nullable(),
  is_fully_completed: z.boolean().nullable(),
  completion_percentage: z.number(),
});

export const BlockWithProgressSchema = z.object({
  block: PublishBlockSchema,
  is_active: z.boolean(),
  is_visible: z.boolean(),
  is_last_block: z.boolean(),
  block_progress: z.record(z.unknown()).optional(), // TODO: Progress types
});

// Complete lesson schema with progressive reveal
export const PublishedLessonWithProgressiveRevealSchema = z.object({
  blocks: z.array(BlockWithProgressSchema),
  metadata: LessonMetadataSchema,
});

export type PublishedLessonWithProgressiveRevealSchemaTypes = z.infer<
  typeof PublishedLessonWithProgressiveRevealSchema
>;

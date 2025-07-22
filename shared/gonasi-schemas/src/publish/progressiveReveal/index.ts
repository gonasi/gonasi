import { z } from 'zod';

import { BlockInteractionSchema } from '../../plugins';
import { PublishBlockSchema } from '../base';

//
// BlockProgressSchema
// Represents the progress a user has made on a specific block
//
export const BlockProgressSchema = z
  .object({
    id: z.string().uuid(),

    // Foreign keys
    organization_id: z.string().uuid(),
    published_course_id: z.string().uuid(),
    chapter_id: z.string().uuid(),
    lesson_id: z.string().uuid(),
    block_id: z.string().uuid(),

    // Progress state
    is_completed: z.boolean(),
    started_at: z.string().datetime(),
    completed_at: z.string().datetime(),
    time_spent_seconds: z.number(),

    // Scoring & attempts
    earned_score: z.number().nullable(),
    attempt_count: z.number().nullable(),

    // Raw interaction details
    interaction_data: z.union([
      BlockInteractionSchema,
      z.object({}).strict(), // strictly empty object
    ]),

    last_response: z.record(z.unknown()).nullable(),
    feedback: z.string().nullable().optional(), // <-- made optional

    // Audit
    user_id: z.string().uuid(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
  .nullable();

export type BlockProgressSchemaTypes = z.infer<typeof BlockProgressSchema>;

//
// SubmitBlockProgressSchema
// Used when a user submits progress for a block
//
export const SubmitBlockProgressSchema = z.object({
  organization_id: z.string().uuid(),
  block_id: z.string().uuid(),
  started_at: z.string().datetime(),
  completed_at: z.string().datetime(),
  time_spent_seconds: z.number(),
  earned_score: z.number().optional(),
  attempt_count: z.number().optional(),
  last_response: z.record(z.unknown()).optional(),
  block_weight: z.number(),

  // This is the actual interaction payload from the frontend
  interaction_data: z.union([
    BlockInteractionSchema,
    z.object({}).strict(), // strictly empty object
  ]),
});

export type SubmitBlockProgressSchemaTypes = z.infer<typeof SubmitBlockProgressSchema>;

export const CompleteBlockProgressInsertSchema = SubmitBlockProgressSchema.extend({
  organization_id: z.string().uuid(),
  published_course_id: z.string().uuid(),
  chapter_id: z.string().uuid(),
  lesson_id: z.string().uuid(),
  block_weight: z.number(),
});

export type CompleteBlockProgressInsertSchemaTypes = z.infer<
  typeof CompleteBlockProgressInsertSchema
>;

//
// BlockProgressOverridesSchema
// Used for patch updates — e.g. score correction, or saving a response separately
//
const BaseBlockProgressSchema = BlockProgressSchema.unwrap(); // drop `.nullable()`

export const BlockProgressOverridesSchema = BaseBlockProgressSchema.pick({
  earned_score: true,
  attempt_count: true,
  interaction_data: true,
  last_response: true,
}).partial(); // all fields optional for PATCH-style updates

export type BlockProgressOverrides = z.infer<typeof BlockProgressOverridesSchema>;

//
// LessonMetadataSchema
// Summary stats for a full lesson
//
export const LessonMetadataSchema = z.object({
  total_blocks: z.number(),
  average_score: z.number().nullable(),

  locked_blocks: z.number(),
  visible_blocks: z.number(),
  available_blocks: z.number(),
  completed_blocks: z.number(),

  active_block_id: z.string().uuid().nullable(),
  total_time_spent: z.number(),
  last_completed_at: z.string().datetime().nullable(),

  is_fully_completed: z.boolean().nullable(),
  completion_percentage: z.number(),
});

//
// BlockWithProgressSchema
// Combines a block definition with progress state
//
export const BlockWithProgressSchema = z.object({
  block: PublishBlockSchema, // the rendered block itself

  is_active: z.boolean(),
  is_visible: z.boolean(),
  is_last_block: z.boolean(),

  block_progress: BlockProgressSchema, // nullable progress object
});

export type BlockWithProgressSchemaTypes = z.infer<typeof BlockWithProgressSchema>;

//
// PublishedLessonWithProgressSchema
// Full lesson object with all blocks and progress metadata
//
export const PublishedLessonWithProgressSchema = z.object({
  blocks: z.array(BlockWithProgressSchema),
  metadata: LessonMetadataSchema,
});

export type PublishedLessonWithProgressSchemaTypes = z.infer<
  typeof PublishedLessonWithProgressSchema
>;

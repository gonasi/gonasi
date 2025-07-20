import { z } from 'zod';

import { LessonTypeSchema, PublishBlockSchema } from '../base';
import { BlockProgressSchema, EnhancedLessonProgressSchema } from '../progress';

// Block reveal information schema
export const BlockRevealInfoSchema = z.object({
  hint_content: z.any().nullable(),
  requires_completion: z.boolean(),
  can_skip: z.boolean(),
  unlock_reason: z.enum(['first_block', 'skippable', 'prerequisites_met', 'locked']),
});

// Interaction states for blocks
export const BlockInteractionStateSchema = z.enum([
  'completed',
  'in_progress',
  'available',
  'locked',
]);

// Available actions for blocks
export const BlockAvailableActionsSchema = z.array(z.string());

// Enhanced block schema with progressive reveal data
// Intersects the base block schema with the progressive reveal properties
export const EnhancedPublishBlockSchema = PublishBlockSchema.and(
  z.object({
    is_visible: z.boolean(),
    interaction_state: BlockInteractionStateSchema,
    available_actions: BlockAvailableActionsSchema,
    progress: BlockProgressSchema,
    reveal_info: BlockRevealInfoSchema,
  }),
);

// Reveal settings schema
export const RevealSettingsSchema = z.object({
  strategy: z.string(),
  total_blocks: z.number().int().nonnegative(),
  visible_blocks: z.number().int().nonnegative(),
  unlock_percentage: z.number().min(0).max(100),
});

// Complete lesson schema with progressive reveal
export const PublishedLessonWithProgressiveRevealSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  chapter_id: z.string().uuid(),
  lesson_type_id: z.string().uuid(),
  name: z.string().nonempty(),
  position: z.number().int().nonnegative(),
  settings: z.any(),
  total_blocks: z.number().int().positive(),
  lesson_types: LessonTypeSchema,
  blocks: z.array(EnhancedPublishBlockSchema),
  reveal_settings: RevealSettingsSchema,
  lesson_progress: EnhancedLessonProgressSchema,
});

export type BlockRevealInfoSchemaTypes = z.infer<typeof BlockRevealInfoSchema>;
export type BlockInteractionStateSchemaTypes = z.infer<typeof BlockInteractionStateSchema>;
export type EnhancedPublishBlockSchemaTypes = z.infer<typeof EnhancedPublishBlockSchema>;
export type RevealSettingsSchemaTypes = z.infer<typeof RevealSettingsSchema>;
export type PublishedLessonWithProgressiveRevealSchemaTypes = z.infer<
  typeof PublishedLessonWithProgressiveRevealSchema
>;

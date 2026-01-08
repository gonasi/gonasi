import { z } from 'zod';

import { BaseInteractionSchema } from '../baseInteractionSchema';

/**
 * Interaction state schema for Image Focus Quiz
 * Tracks user progress through focus regions
 */
export const ImageFocusQuizStateSchema = z.object({
  /** Index of the current region being viewed */
  currentRegionIndex: z.number().int().min(0),

  /** Array of region IDs that have been completed */
  completedRegions: z.array(z.string()),

  /** Actual order of regions for this session (respects shuffle setting) */
  regionOrder: z.array(z.number().int().min(0)),

  /** ISO timestamp when the quiz started */
  startedAt: z.string().datetime(),

  /** Whether the current region's answer has been revealed */
  currentAnswerRevealed: z.boolean().default(false),

  /** ISO timestamp when current region was first shown */
  currentRegionStartedAt: z.string().datetime().optional(),
});
export type ImageFocusQuizStateSchemaTypes = z.infer<typeof ImageFocusQuizStateSchema>;

/**
 * Full interaction schema for Image Focus Quiz
 * Extends base interaction with Image Focus Quiz specific state
 */
export const ImageFocusQuizInteractionSchema = BaseInteractionSchema.extend({
  plugin_type: z.literal('image_focus_quiz'),
  state: ImageFocusQuizStateSchema,
});
export type ImageFocusQuizInteractionSchemaTypes = z.infer<typeof ImageFocusQuizInteractionSchema>;

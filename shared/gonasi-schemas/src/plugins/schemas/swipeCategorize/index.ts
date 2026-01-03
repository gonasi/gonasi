import { z } from 'zod';

import { BasePluginSettingsSchema } from '../../pluginSettings';
import { NonEmptyLexicalState } from '../../utils';
import {
  CardContentSchema,
  type CardContentSchemaTypes,
  type CardDisplaySettingsSchemaTypes,
} from '../shared/cardContent';

// Re-export shared types for backward compatibility
export type { CardContentSchemaTypes, CardDisplaySettingsSchemaTypes };

// ============================================================================
// Card Schema
// ============================================================================

export const CardSchema = z.object({
  id: z.string().uuid(),
  contentData: CardContentSchema,
  correctCategory: z.enum(['left', 'right']),
  // Position index for custom ordering (allows shuffling)
  index: z.number().int().min(0),
});
export type CardSchemaTypes = z.infer<typeof CardSchema>;

// ============================================================================
// Content Schema
// ============================================================================

export const SwipeCategorizeContentSchema = z.object({
  questionState: NonEmptyLexicalState,
  leftLabel: z
    .string()
    .trim()
    .min(1, 'Left category label is required.')
    .max(20, 'Left label must be 20 characters or fewer.'),
  rightLabel: z
    .string()
    .trim()
    .min(1, 'Right category label is required.')
    .max(20, 'Right label must be 20 characters or fewer.'),
  cards: z
    .array(CardSchema)
    .min(3, 'You must provide at least 3 cards.')
    .max(20, 'You can provide up to 20 cards.'),
  hint: z
    .string()
    .trim()
    .min(10, 'Hint must be at least 10 characters.')
    .max(100, 'Hint must be 100 characters or fewer.')
    .optional(),
});
export type SwipeCategorizeContentSchemaTypes = z.infer<typeof SwipeCategorizeContentSchema>;

// ============================================================================
// Settings Schema
// ============================================================================

export const SwipeCategorizeSettingsSchema = BasePluginSettingsSchema.extend({
  randomization: z.enum(['none', 'shuffle']),
});
export type SwipeCategorizeSettingsSchemaTypes = z.infer<typeof SwipeCategorizeSettingsSchema>;

// ============================================================================
// Full Plugin Schema
// ============================================================================

export const SwipeCategorizeSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string({ required_error: 'Organization Id is required.' }),
  course_id: z.string({ required_error: 'Course Id is required.' }),
  chapter_id: z.string({ required_error: 'Chapter Id is required.' }),
  lesson_id: z.string({ required_error: 'Lesson Id is required.' }),
  plugin_type: z.literal('swipe_categorize'),
  content: SwipeCategorizeContentSchema,
  settings: SwipeCategorizeSettingsSchema,
});
export type SwipeCategorizeSchemaTypes = z.infer<typeof SwipeCategorizeSchema>;

import { z } from 'zod';

import { BasePluginSettingsSchema, LayoutPluginSettingsSchema } from '../../pluginSettings';
import { NonEmptyLexicalState } from '../../utils';

// ============================================================================
// Matching Pair Schema
// ============================================================================

export const MatchingPairSchema = z.object({
  id: z.string().uuid(),
  leftContent: NonEmptyLexicalState,
  rightContent: NonEmptyLexicalState,
});
export type MatchingPairSchemaTypes = z.infer<typeof MatchingPairSchema>;

// ============================================================================
// Content Schema
// ============================================================================

export const MatchingGameContentSchema = z.object({
  questionState: NonEmptyLexicalState,
  pairs: z
    .array(MatchingPairSchema)
    .min(2, 'You must provide at least 2 pairs.')
    .max(10, 'You can provide up to 10 pairs.'),
  hint: z
    .string()
    .trim()
    .min(10, 'Hint must be at least 10 characters.')
    .max(100, 'Hint must be 100 characters or fewer.')
    .optional(),
  explanationState: NonEmptyLexicalState,
});
export type MatchingGameContentSchemaTypes = z.infer<typeof MatchingGameContentSchema>;

// ============================================================================
// Settings Schema
// ============================================================================

export const MatchingGameSettingsSchema = BasePluginSettingsSchema.merge(
  LayoutPluginSettingsSchema,
).extend({
  // Future settings can be added here
  // e.g., showPairNumbers: z.boolean().default(true)
});
export type MatchingGameSettingsSchemaTypes = z.infer<typeof MatchingGameSettingsSchema>;

// ============================================================================
// Full Plugin Schema
// ============================================================================

export const MatchingGameSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string({ required_error: 'Organization Id is required.' }),
  course_id: z.string({ required_error: 'Course Id is required.' }),
  chapter_id: z.string({ required_error: 'Chapter Id is required.' }),
  lesson_id: z.string({ required_error: 'Lesson Id is required.' }),
  plugin_type: z.literal('matching_game'),
  content: MatchingGameContentSchema,
  settings: MatchingGameSettingsSchema,
});
export type MatchingGameSchemaTypes = z.infer<typeof MatchingGameSchema>;

import { z } from 'zod';

import { LayoutPluginSettingsSchema, NonEmptyLexicalState } from '../../../plugins';

//
// Content Schema
//
export const LiveSessionTrueOrFalseContentSchema = z.object({
  questionState: NonEmptyLexicalState,
  correctAnswer: z.enum(['true', 'false'], {
    required_error: 'Select whether the correct answer is true or false.',
  }),
});
export type LiveSessionTrueOrFalseContentSchemaTypes = z.infer<
  typeof LiveSessionTrueOrFalseContentSchema
>;

export const LiveSessionTrueOrFalseSettingsSchema = LayoutPluginSettingsSchema.extend({});
export type LiveSessionTrueOrFalseSettingsSchemaTypes = z.infer<
  typeof LiveSessionTrueOrFalseSettingsSchema
>;

export const LiveSessionTrueOrFalseSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string({ required_error: 'Organization Id is required.' }),
  live_session_id: z.string().uuid(),
  plugin_type: z.literal('true_or_false'),
  content: LiveSessionTrueOrFalseContentSchema,
  settings: LiveSessionTrueOrFalseSettingsSchema,
  difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
  time_limit: z
    .number()
    .int()
    .min(5, 'Time limit must be at least 5 seconds')
    .max(30, 'Time limit cannot exceed 30 seconds')
    .default(10),
});
export type LiveSessionTrueOrFalseSchemaTypes = z.infer<typeof LiveSessionTrueOrFalseSchema>;

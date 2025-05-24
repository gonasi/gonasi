import { z } from 'zod';

import { BasePluginSettingsSchema, LayoutPluginSettingsSchema } from './pluginSettings';

//
// Content Schema
//
export const TrueOrFalseContentSchema = z.object({
  questionState: z
    .string({ required_error: 'Question is required.' })
    .trim()
    .min(5, 'The question must be at least 5 characters long.'),

  correctAnswer: z.enum(['true', 'false'], {
    required_error: 'Select whether the correct answer is true or false.',
  }),

  hint: z
    .string()
    .trim()
    .min(10, 'Hint must be at least 10 characters.')
    .max(100, 'Hint must be 100 characters or fewer.')
    .optional(),

  explanationState: z
    .string({ required_error: 'Explanation is required.' })
    .trim()
    .min(10, 'The explanation must be at least 10 characters long.'),
});

//
// Plugin Settings Schema
//
export const TrueOrFalseSettingsSchema = BasePluginSettingsSchema.merge(
  LayoutPluginSettingsSchema,
).extend({});

//
// Create Block Schema
//
export const SubmitCreateTrueOrFalseSchema = z.object({
  content: TrueOrFalseContentSchema,
  lessonId: z.string({ required_error: 'Lesson ID is required.' }),
  pluginType: z.literal('true_or_false').default('true_or_false'),
  weight: z.number().default(1),
  settings: TrueOrFalseSettingsSchema,
});

//
// Edit Block Settings Schema
//
export const SubmitEditTrueOrFalseSettingsSchema = TrueOrFalseSettingsSchema.extend({
  blockId: z.string({ required_error: 'Block ID is required.' }),
});

//
// Interaction Schema
//
export const TrueOrFalseStateInteractionSchema = z.object({
  correctAttempt: z
    .object({
      selected: z.boolean(),
      timestamp: z.number(),
    })
    .nullable()
    .default(null),

  wrongAttempts: z
    .array(
      z.object({
        selected: z.boolean(),
        timestamp: z.number(),
      }),
    )
    .default([]),
  showCheckIfAnswerIsCorrectButton: z.boolean().default(true),
  showTryAgainButton: z.boolean().default(false),
  showShowAnswerButton: z.boolean().default(false),
  showContinueButton: z.boolean().default(false),
  showScore: z.boolean().default(false),
  canShowExplanationButton: z.boolean().default(false),
  hasRevealedCorrectAnswer: z.boolean().default(false),
});

//
// Types
//
export type TrueOrFalseContentSchemaType = z.infer<typeof TrueOrFalseContentSchema>;
export type TrueOrFalseSettingsSchemaType = z.infer<typeof TrueOrFalseSettingsSchema>;
export type SubmitCreateTrueOrFalseSchemaType = z.infer<typeof SubmitCreateTrueOrFalseSchema>;
export type SubmitEditTrueOrFalseSettingsSchemaType = z.infer<
  typeof SubmitEditTrueOrFalseSettingsSchema
>;
export type TrueOrFalseStateInteractionSchemaType = z.infer<
  typeof TrueOrFalseStateInteractionSchema
>;

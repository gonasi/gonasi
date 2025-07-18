import { z } from 'zod';

import { BasePluginSettingsSchema, LayoutPluginSettingsSchema } from './pluginSettings';

//
// Choice Schema
//
export const ChoiceSchema = z.object({
  choiceState: z
    .string({ required_error: 'Choice is required.' })
    .trim()
    .min(5, 'The choice must be at least 5 characters long.'),
  uuid: z
    .string({ required_error: 'Card uuid is required.' })
    .uuid('Card uuid must be a valid UUID.'),
});

//
// Content Schema
//
export const MultipleChoiceSingleAnswerContentSchema = z.object({
  questionState: z
    .string({ required_error: 'Question is required.' })
    .trim()
    .min(5, 'The question must be at least 5 characters long.'),

  choices: z
    .array(ChoiceSchema)
    .min(2, 'At least two choices are required.')
    .max(10, 'No more than 10 choices are allowed.'),

  correctAnswer: z.string({ required_error: 'Correct answer is required.' }),

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

  uuid: z.string().optional(),
});

//
// Plugin Settings Schema
//
export const MultipleChoiceSingleAnswerSettingsSchema = BasePluginSettingsSchema.merge(
  LayoutPluginSettingsSchema,
).extend({});

//
// Create Block Schema
//
export const SubmitCreateMultipleChoiceSingleAnswerSchema = z.object({
  content: MultipleChoiceSingleAnswerContentSchema,
  lessonId: z.string({ required_error: 'Lesson ID is required.' }),
  plugin_type: z.literal('multiple_choice_single').default('multiple_choice_single'),
  weight: z.number().default(1),
  settings: MultipleChoiceSingleAnswerSettingsSchema,
});

//
// Edit Block Settings Schema
//
export const SubmitMultipleChoiceSingleAnswerSettingsSchema =
  MultipleChoiceSingleAnswerSettingsSchema.extend({
    blockId: z.string({ required_error: 'Block ID is required.' }),
  });

//
// Interaction Schema
//
export const MultipleChoiceSingleAnswerInteractionSchema = z.object({
  correctAttempt: z
    .object({
      selected: z.string(),
      timestamp: z.number(),
    })
    .nullable()
    .default(null),

  wrongAttempts: z
    .array(
      z.object({
        selected: z.string(),
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
export type ChoiceSchemaType = z.infer<typeof ChoiceSchema>;
export type MultipleChoiceSingleAnswerContentSchemaType = z.infer<
  typeof MultipleChoiceSingleAnswerContentSchema
>;
export type MultipleChoiceSingleAnswerSettingsSchemaType = z.infer<
  typeof MultipleChoiceSingleAnswerSettingsSchema
>;
export type SubmitCreateMultipleChoiceSingleAnswerSchemaType = z.infer<
  typeof SubmitCreateMultipleChoiceSingleAnswerSchema
>;
export type SubmitMultipleChoiceSingleAnswerSettingsSchemaType = z.infer<
  typeof SubmitMultipleChoiceSingleAnswerSettingsSchema
>;
export type MultipleChoiceSingleAnswerInteractionSchemaType = z.infer<
  typeof MultipleChoiceSingleAnswerInteractionSchema
>;

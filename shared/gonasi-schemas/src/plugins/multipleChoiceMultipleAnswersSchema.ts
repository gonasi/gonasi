import { z } from 'zod';

import { BasePluginSettingsSchema, LayoutPluginSettingsSchema } from './pluginSettings';

//
// Choice Schema
//
export const MultipleChoiceSchema = z.object({
  choiceState: z
    .string({ required_error: 'Choice is required.' })
    .trim()
    .min(5, 'The choice must be at least 5 characters long.'),
  uuid: z
    .string({ required_error: 'Card uuid is required' })
    .uuid('Card uuid must be a valid UUID'),
});

//
// Content Schema
//
export const MultipleChoiceMultipleAnswersContentSchema = z.object({
  questionState: z
    .string({ required_error: 'Question is required.' })
    .trim()
    .min(5, 'The question must be at least 5 characters long.'),

  choices: z
    .array(MultipleChoiceSchema)
    .min(2, 'At least two choices are required.')
    .max(6, 'No more than six choices are allowed.'),

  correctAnswers: z
    .array(
      z
        .string({ required_error: 'Each correct answer must be a uuid.' })
        .uuid('Card uuid must be a valid UUID'),
    )
    .min(1, 'At least one correct answer is required.'),

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
export const MultipleChoiceMultipleAnswersSettingsSchema = BasePluginSettingsSchema.merge(
  LayoutPluginSettingsSchema,
).extend({});

//
// Create Block Schema
//
export const SubmitCreateMultipleChoiceMultipleAnswersSchema = z.object({
  content: MultipleChoiceMultipleAnswersContentSchema,
  lessonId: z.string({ required_error: 'Lesson ID is required.' }),
  plugin_type: z.literal('multiple_choice_multiple').default('multiple_choice_multiple'),
  weight: z.number().default(1),
  settings: MultipleChoiceMultipleAnswersSettingsSchema,
});

//
// Edit Block Settings Schema
//
export const SubmitMultipleChoiceMultipleAnswersSettingsSchema =
  MultipleChoiceMultipleAnswersSettingsSchema.extend({
    blockId: z.string({ required_error: 'Block ID is required.' }),
  });

//
// Interaction Schema
//
export const MultipleChoiceMultipleAnswersInteractionSchema = z.object({
  correctAttempt: z
    .object({
      selected: z.array(z.string()),
      timestamp: z.number(),
    })
    .nullable()
    .default(null),

  wrongAttempts: z
    .array(
      z.object({
        selected: z.array(z.string()),
        timestamp: z.number(),
        partiallyCorrect: z.boolean().default(false),
      }),
    )
    .default([]),

  isCorrect: z.boolean().default(false).nullable(),
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
export type MultipleChoiceSchemaType = z.infer<typeof MultipleChoiceSchema>;
export type MultipleChoiceMultipleAnswersContentSchemaType = z.infer<
  typeof MultipleChoiceMultipleAnswersContentSchema
>;
export type MultipleChoiceMultipleAnswersSettingsSchemaType = z.infer<
  typeof MultipleChoiceMultipleAnswersSettingsSchema
>;
export type SubmitCreateMultipleChoiceMultipleAnswersSchemaType = z.infer<
  typeof SubmitCreateMultipleChoiceMultipleAnswersSchema
>;
export type SubmitMultipleChoiceMultipleAnswersSettingsSchemaType = z.infer<
  typeof SubmitMultipleChoiceMultipleAnswersSettingsSchema
>;
export type MultipleChoiceMultipleAnswersInteractionSchemaType = z.infer<
  typeof MultipleChoiceMultipleAnswersInteractionSchema
>;

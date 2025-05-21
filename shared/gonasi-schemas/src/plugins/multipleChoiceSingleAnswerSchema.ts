import { z } from 'zod';

import { BaseInteractionSchema } from './baseInteractionSchema';
import { BasePluginSettingsSchema } from './pluginSettings';

export const ChoiceSchema = z.object({
  choiceState: z
    .string({ required_error: 'Choice is required.' })
    .trim()
    .min(5, 'The choice must be at least 5 characters long.'),
  uuid: z
    .string({ required_error: 'Card uuid is required' })
    .uuid('Card uuid must be a valid UUID'),
});

export const MultipleChoiceSingleAnswerSchema = z.object({
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

export const MultipleChoiceSingleAnswerSettingsSchema = BasePluginSettingsSchema.extend({});

export type MultipleChoiceSingleAnswerSchemaType = z.infer<typeof MultipleChoiceSingleAnswerSchema>;
export type MultipleChoiceSingleAnswerSettingsType = z.infer<
  typeof MultipleChoiceSingleAnswerSettingsSchema
>;

export const MultipleChoiceSingleAnswerInteractionSchema = BaseInteractionSchema.extend({
  optionSelected: z.boolean().default(false).nullable(),

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

  isCorrect: z.boolean().nullable().default(null),
});

export type MultipleChoiceSingleAnswerInteractionType = z.infer<
  typeof MultipleChoiceSingleAnswerInteractionSchema
>;

export type ChoiceType = z.infer<typeof ChoiceSchema>;

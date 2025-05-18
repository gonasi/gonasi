import { z } from 'zod';

import { BaseInteractionSchema } from './baseInteractionSchema';
import { PluginSettingsSchema } from './pluginSettings';

export const MultipleChoiceSchema = z.object({
  choiceState: z
    .string({ required_error: 'Choice is required.' })
    .trim()
    .min(5, 'The choice must be at least 5 characters long.'),
  uuid: z
    .string({ required_error: 'Card uuid is required' })
    .uuid('Card uuid must be a valid UUID'),
});

export const MultipleChoiceMultipleAnswersSchema = z.object({
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

export const MultipleChoiceMultipleAnswersSettingsSchema = PluginSettingsSchema.extend({});

export type MultipleChoiceMultipleAnswersSchemaType = z.infer<
  typeof MultipleChoiceMultipleAnswersSchema
>;
export type MultipleChoiceMultipleAnswersSettingsType = z.infer<
  typeof MultipleChoiceMultipleAnswersSettingsSchema
>;

export const MultipleChoiceMultipleAnswersInteractionSchema = BaseInteractionSchema.extend({
  selectedOptions: z.array(z.string()).nullable().optional(),

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
      }),
    )
    .default([]),

  isCorrect: z.boolean().nullable().default(null),
});

export type MultipleChoiceMultipleAnswersInteractionType = z.infer<
  typeof MultipleChoiceMultipleAnswersInteractionSchema
>;

export type MultipleChoiceType = z.infer<typeof MultipleChoiceSchema>;

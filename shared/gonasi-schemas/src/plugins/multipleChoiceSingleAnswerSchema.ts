import { z } from 'zod';

import { BaseInteractionSchema } from './baseInteractionSchema';
import { PluginSettingsSchema } from './pluginSettings';

export const MultipleChoiceSingleAnswerSchema = z.object({
  questionState: z
    .string({ required_error: 'Question is required.' })
    .trim()
    .min(5, 'The question must be at least 5 characters long.'),

  choices: z
    .array(z.string().trim().min(1, 'Each choice must be at least 1 character long.'))
    .min(2, 'At least two choices are required.')
    .max(6, 'No more than six choices are allowed.'),

  correctAnswer: z
    .string({ required_error: 'Correct answer is required.' })
    .trim()
    .refine((val) => ['A', 'B', 'C', 'D', 'E', 'F'].includes(val), {
      message: 'Correct answer must be one of A-F.',
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

  uuid: z.string().optional(),
});

export const MultipleChoiceSingleAnswerSettingsSchema = PluginSettingsSchema.extend({});

export type MultipleChoiceSingleAnswerSchemaType = z.infer<typeof MultipleChoiceSingleAnswerSchema>;
export type MultipleChoiceSingleAnswerSettingsType = z.infer<
  typeof MultipleChoiceSingleAnswerSettingsSchema
>;

export const MultipleChoiceSingleAnswerInteractionSchema = BaseInteractionSchema.extend({
  optionSelected: z.boolean().default(false).nullable(),

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

  isCorrect: z.boolean().nullable().default(null),
});

export type MultipleChoiceSingleAnswerInteractionType = z.infer<
  typeof MultipleChoiceSingleAnswerInteractionSchema
>;

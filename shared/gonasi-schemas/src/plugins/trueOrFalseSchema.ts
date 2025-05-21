import { z } from 'zod';

import { BaseInteractionSchema } from './baseInteractionSchema';
import { BasePluginSettingsSchema } from './pluginSettings';

export const TrueOrFalseSchema = z.object({
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

  uuid: z.string().optional(),
});

export const TrueOrFalseSettingsSchema = BasePluginSettingsSchema.extend({});

export type TrueOrFalseSchemaType = z.infer<typeof TrueOrFalseSchema>;
export type TrueOrFalseSettingsType = z.infer<typeof TrueOrFalseSettingsSchema>;

export const TrueOrFalseInteractionSchema = BaseInteractionSchema.extend({
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

export type TrueOrFalseInteractionType = z.infer<typeof TrueOrFalseInteractionSchema>;

export const MultiSelectInteractionSchema = BaseInteractionSchema.extend({
  interactionType: z.literal('multiSelect'),

  correctAttempt: z
    .object({
      selectedIds: z.array(z.string()),
      timestamp: z.number(),
    })
    .nullable()
    .default(null),

  wrongAttempts: z
    .array(
      z.object({
        selectedIds: z.array(z.string()),
        timestamp: z.number(),
      }),
    )
    .default([]),
});

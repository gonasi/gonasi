import { z } from 'zod';

export const MultipleChoiceSingleAnswerStateInteractionSchema = z.object({
  plugin_type: z.literal('multiple_choice_single'),
  correctAttempt: z
    .object({
      selected: z.boolean(),
      timestamp: z.number(),
      wasRevealed: z.boolean().optional(),
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

export type MultipleChoiceSingleAnswerStateInteractionSchemaTypes = z.infer<
  typeof MultipleChoiceSingleAnswerStateInteractionSchema
>;

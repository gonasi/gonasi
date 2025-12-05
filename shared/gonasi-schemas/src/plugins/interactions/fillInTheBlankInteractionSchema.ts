import { z } from 'zod';

export const FillInTheBlankStateInteractionSchema = z.object({
  plugin_type: z.literal('fill_in_the_blank'),
  userAnswer: z.string().default(''),

  correctAttempt: z
    .object({
      answer: z.string(),
      timestamp: z.number(),
      wasRevealed: z.boolean().optional(),
    })
    .nullable()
    .default(null),

  wrongAttempts: z
    .array(
      z.object({
        answer: z.string(),
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

export type FillInTheBlankStateInteractionSchemaTypes = z.infer<
  typeof FillInTheBlankStateInteractionSchema
>;

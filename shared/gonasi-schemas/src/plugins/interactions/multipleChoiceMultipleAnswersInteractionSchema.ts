import { z } from 'zod';

export const MultipleChoiceMultipleAnswersInteractionSchema = z.object({
  plugin_type: z.literal('multiple_choice_multiple'),

  correctAttempt: z
    .object({
      selected: z.array(z.string()),
      timestamp: z.number(),
      wasRevealed: z.boolean().optional(),
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

  showCheckIfAnswerIsCorrectButton: z.boolean().default(true),
  showTryAgainButton: z.boolean().default(false),
  showShowAnswerButton: z.boolean().default(false),
  showContinueButton: z.boolean().default(false),
  showScore: z.boolean().default(false),
  canShowExplanationButton: z.boolean().default(false),
  hasRevealedCorrectAnswer: z.boolean().default(false),
  isCorrect: z.boolean().default(false),
});

export type MultipleChoiceMultipleAnswersInteractionSchemaTypes = z.infer<
  typeof MultipleChoiceMultipleAnswersInteractionSchema
>;

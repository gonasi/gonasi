import { z } from 'zod';

export const BaseInteractionSchema = z.object({
  /**
   * Indicates whether the user has completed the node
   * either by answering correctly or skipping.
   */
  continue: z.boolean().default(false),

  /**
   * Number of times the user has attempted an answer.
   */
  attemptsCount: z.number().nonnegative().default(0),

  /**
   * Whether the user is allowed to see the correct answer.
   */
  canShowCorrectAnswer: z.boolean().default(false),

  /**
   * Whether the user has chosen to reveal the correct answer.
   */
  correctAnswerRevealed: z.boolean().default(false),

  /**
   * Whether the "Continue" button should be shown.
   */
  canShowContinueButton: z.boolean().default(false),

  /**
   * Whether the explanation button should be shown.
   * Only enabled after correct answer is given.
   */
  canShowExplanationButton: z.boolean().default(false),

  /**
   * The type of interaction (used for type-specific validation or rendering).
   */
  interactionType: z.enum(['trueOrFalse', 'singleSelect', 'multiSelect']),
});

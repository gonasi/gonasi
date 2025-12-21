import { z } from 'zod';

// ============================================================================
// Matching Game Interaction State Schema
// ============================================================================

const MatchedPairSchema = z.object({
  leftId: z.string().uuid(),
  rightId: z.string().uuid(),
  timestamp: z.number(),
  wasRevealed: z.boolean().default(false),
});

const WrongAttemptsPerLeftItemSchema = z.object({
  leftId: z.string().uuid(),
  wrongRightIds: z.array(z.string().uuid()),
});

const MatchAttemptSchema = z.object({
  leftId: z.string().uuid(),
  rightId: z.string().uuid(),
  timestamp: z.number(),
  isCorrect: z.boolean(),
});

export const MatchingGameInteractionSchema = z.object({
  plugin_type: z.literal('matching_game'),

  // Currently selected left item (null if none selected)
  selectedLeftId: z.string().uuid().nullable().default(null),

  // Map of left item ID → array of wrong right item IDs attempted
  // Stored as array of objects for JSON compatibility
  wrongAttemptsPerLeftItem: z.array(WrongAttemptsPerLeftItemSchema).default([]),

  // Array of successfully matched pairs
  matchedPairs: z.array(MatchedPairSchema).default([]),

  // All attempts (for analytics/tracking)
  allAttempts: z.array(MatchAttemptSchema).default([]),

  // UI state flags
  showTryAgainButton: z.boolean().default(false),
  showShowAnswerButton: z.boolean().default(false),
  showContinueButton: z.boolean().default(false),
  canShowExplanationButton: z.boolean().default(false),
  hasRevealedCorrectAnswer: z.boolean().default(false),
});

export type MatchingGameInteractionSchemaTypes = z.infer<typeof MatchingGameInteractionSchema>;

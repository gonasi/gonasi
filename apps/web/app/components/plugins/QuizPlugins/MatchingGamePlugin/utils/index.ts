import type { MatchingGameInteractionSchemaTypes } from '@gonasi/schemas/plugins';

const MAX_SCORE = 100;
const PENALTY_PER_WRONG_ATTEMPT = 5;
const MINIMUM_SCORE = 10;

/**
 * Calculate the score for a matching game based on the interaction state.
 *
 * Scoring formula:
 * - Base score: (correct matches / total pairs) * 100
 * - Penalty: 5 points per wrong attempt
 * - Minimum: 10 points (if at least one correct match)
 *
 * @param state - The current interaction state
 * @param totalPairs - Total number of pairs in the matching game
 * @returns The calculated score (0-100)
 */
export function calculateMatchingGameScore(
  state: MatchingGameInteractionSchemaTypes,
  totalPairs: number,
): number {
  const correctMatches = state.matchedPairs.length;

  // No matches = no score
  if (correctMatches === 0) {
    return 0;
  }

  // Calculate total wrong attempts across all left items
  const totalWrongAttempts = state.wrongAttemptsPerLeftItem.reduce(
    (sum, entry) => sum + entry.wrongRightIds.length,
    0,
  );

  // Calculate base score as percentage of correct matches
  const baseScore = (correctMatches / totalPairs) * MAX_SCORE;

  // Apply penalty for wrong attempts
  const penalty = totalWrongAttempts * PENALTY_PER_WRONG_ATTEMPT;

  // Calculate final score with minimum threshold
  const finalScore = Math.max(MINIMUM_SCORE, baseScore - penalty);

  // Round to nearest integer
  return Math.round(finalScore);
}

import type { TrueOrFalseStateInteractionSchemaType } from '@gonasi/schemas/plugins';

// Score calculation function
export function calculateTrueFalseScore(state: TrueOrFalseStateInteractionSchemaType): number {
  const MAX_SCORE = 100;
  const PENALTY_PER_WRONG_ATTEMPT = 50;

  // No score if no correct attempt was made
  if (state.correctAttempt === null) {
    return 0;
  }

  // No score if the correct answer was revealed (not earned)
  if (state.hasRevealedCorrectAnswer) {
    return 0;
  }

  // Calculate penalty based on wrong attempts
  const penalty = state.wrongAttempts.length * PENALTY_PER_WRONG_ATTEMPT;
  return Math.max(MAX_SCORE - penalty, 0);
}

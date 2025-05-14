/**
 * Calculates the score for a multiple choice single answer question based on interaction state.
 *
 * Scoring logic:
 * - Correct on first attempt: 100%
 * - Correct after one wrong attempt: 75%
 * - Correct after two wrong attempts: 50%
 * - Correct after three or more wrong attempts: 25%
 * - Revealed answer: 0%
 */
export function calculateMultipleChoiceSingleAnswerScore({
  isCorrect,
  correctAnswerRevealed,
  wrongAttemptsCount,
}: {
  isCorrect: boolean | null;
  correctAnswerRevealed: boolean;
  wrongAttemptsCount: number;
}): number {
  // If correct answer was revealed, score is 0
  if (correctAnswerRevealed) return 0;

  // If not correct yet, no score
  if (!isCorrect) return 0;

  // Score based on number of wrong attempts
  switch (wrongAttemptsCount) {
    case 0:
      return 100; // No wrong attempts = full score
    case 1:
      return 75; // One wrong attempt = 75% score
    case 2:
      return 50; // Two wrong attempts = 50% score
    default:
      return 25; // Three or more wrong attempts = 25% score
  }
}

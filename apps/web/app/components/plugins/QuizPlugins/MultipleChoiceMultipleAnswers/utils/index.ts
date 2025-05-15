/**
 * Calculates a score for multiple choice questions with multiple answers
 * considering various factors like partial correctness, wrong attempts,
 * and time taken to answer.
 *
 * @param params Scoring parameters
 * @returns A score between 0 and 100
 */
export function calculateMultipleChoiceMultipleAnswersScore({
  isCorrect,
  correctAnswersRevealed,
  wrongAttemptsCount,
  correctSelectedCount,
  totalCorrectAnswers,
  wrongAttemptsData,
  correctAnswers,
  timeToAnswer,
  maxTimeExpected,
}: {
  isCorrect: boolean | null;
  correctAnswersRevealed: boolean;
  wrongAttemptsCount: number;
  correctSelectedCount?: number;
  totalCorrectAnswers?: number;
  wrongAttemptsData?: { selected: number[]; timestamp: number }[];
  correctAnswers?: number[];
  timeToAnswer?: number;
  maxTimeExpected?: number;
}): number {
  // If correct answers were revealed by the system, score is 0
  if (correctAnswersRevealed) return 0;

  // If not correct yet and we have enough data for partial scoring
  if (
    !isCorrect &&
    correctSelectedCount !== undefined &&
    totalCorrectAnswers !== undefined &&
    totalCorrectAnswers > 0
  ) {
    // If user hasn't selected anything correctly yet, return 0
    if (correctSelectedCount === 0) return 0;

    // Calculate partial score as a percentage of correct answers found
    // but cap it at 40% to encourage complete solutions
    const partialScore = Math.min((correctSelectedCount / totalCorrectAnswers) * 40, 40);
    return Math.round(partialScore);
  }

  // Simple score calculation for older implementations
  if (!correctAnswers && !wrongAttemptsData) {
    // Fall back to original logic if we don't have the new parameters
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

  // Advanced scoring with the full data available
  // Base score calculation for correct answers
  let baseScore = 100;

  // Penalty for wrong attempts (more nuanced than the original)
  const wrongAttemptsPenalty = Math.min(wrongAttemptsCount * 15, 60);
  baseScore -= wrongAttemptsPenalty;

  // Analyze wrong attempts to find partially correct ones
  let partiallyCorrectAttempts = 0;
  if (wrongAttemptsData && correctAnswers) {
    // Count attempts that had at least one correct answer
    partiallyCorrectAttempts = wrongAttemptsData.filter((attempt) => {
      // Check if any of the selected options were correct
      return attempt.selected.some((option) => correctAnswers.includes(option));
    }).length;

    // Bonus for partially correct attempts
    if (partiallyCorrectAttempts > 0) {
      const partialBonus = Math.min(partiallyCorrectAttempts * 5, 15);
      baseScore += partialBonus;
    }
  }

  // Time-based scoring adjustment (if provided)
  if (timeToAnswer && maxTimeExpected && maxTimeExpected > 0) {
    // Fast answers get a bonus, slow answers get a penalty
    const timeRatio = timeToAnswer / maxTimeExpected;
    let timeFactor = 0;

    if (timeRatio <= 0.5) {
      // Answered in half the expected time or less: bonus up to 10 points
      timeFactor = 10;
    } else if (timeRatio <= 1) {
      // Answered within expected time: bonus scales from 10 to 0
      timeFactor = 10 - 10 * ((timeRatio - 0.5) / 0.5);
    } else if (timeRatio <= 2) {
      // Took up to twice the expected time: penalty scales from 0 to -5
      timeFactor = -5 * ((timeRatio - 1) / 1);
    } else {
      // Took more than twice the expected time: max penalty of -5
      timeFactor = -5;
    }

    baseScore += timeFactor;
  }

  // Ensure the final score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(baseScore)));
}

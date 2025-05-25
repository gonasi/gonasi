/**
 * Scoring function for multiple choice, multiple answer questions
 * Uses explicit scoring tiers for common cases with difficulty adjustments
 */
export function calculateMultipleChoiceMultipleAnswerScore({
  correctAnswersRevealed,
  wrongAttemptsCount,
  totalChoices,
  totalCorrectAnswers,
}: {
  correctAnswersRevealed: boolean;
  wrongAttemptsCount: number;
  totalChoices: number;
  totalCorrectAnswers: number;
}): number {
  // If correct answer was revealed, score is 0
  if (correctAnswersRevealed) return 0;

  // Score based on total choices and wrong attempts
  switch (totalChoices) {
    case 2:
      // Binary choice: 100% first try, 50% second try
      return wrongAttemptsCount === 0 ? 100 : 50;

    case 3:
      // Three choices: 100%, 67%, 33%
      switch (wrongAttemptsCount) {
        case 0:
          return 100;
        case 1:
          return 67;
        default:
          return 33;
      }

    case 4:
      // Four choices: 100%, 75%, 50%, 25%
      switch (wrongAttemptsCount) {
        case 0:
          return 100;
        case 1:
          return 75;
        case 2:
          return 50;
        default:
          return 25;
      }

    case 5:
      // Five choices: 100%, 80%, 60%, 40%, 20%
      switch (wrongAttemptsCount) {
        case 0:
          return 100;
        case 1:
          return 80;
        case 2:
          return 60;
        case 3:
          return 40;
        default:
          return 20;
      }

    default: {
      // For 6+ choices, use formula approach
      const penaltyPerWrongAttempt = 100 / totalChoices;
      const score = 100 - wrongAttemptsCount * penaltyPerWrongAttempt;

      // Adjust for difficulty based on correct answer ratio
      const difficultyRatio = totalCorrectAnswers / totalChoices;
      const difficultyBonus = difficultyRatio < 0.3 ? 5 : 0; // Small bonus for very selective questions

      return Math.max(10, Math.round(score + difficultyBonus));
    }
  }
}

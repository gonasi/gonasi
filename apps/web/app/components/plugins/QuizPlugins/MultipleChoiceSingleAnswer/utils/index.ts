/**
 * Alternative implementation with explicit scoring tiers for common cases
 */
export function calculateMultipleChoiceSingleAnswerScore({
  correctAnswerRevealed,
  wrongAttemptsCount,
  numberOfOptions,
}: {
  correctAnswerRevealed: boolean;
  wrongAttemptsCount: number;
  numberOfOptions: number;
}): number {
  // If correct answer was revealed, score is 0
  if (correctAnswerRevealed) return 0;

  // Score based on number of options and wrong attempts
  switch (numberOfOptions) {
    case 2:
      // Binary choice: 100% first try, 50% second try
      return wrongAttemptsCount === 0 ? 100 : 50;

    case 3:
      // Three options: 100%, 67%, 33%
      switch (wrongAttemptsCount) {
        case 0:
          return 100;
        case 1:
          return 67;
        default:
          return 33;
      }

    case 4:
      // Four options: 100%, 75%, 50%, 25%
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
      // Five options: 100%, 80%, 60%, 40%, 20%
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

    default:
      // For 6+ options, use formula approach with minimum 10% score
      const penaltyPerWrongAttempt = 100 / numberOfOptions;
      const score = 100 - wrongAttemptsCount * penaltyPerWrongAttempt;
      return Math.max(10, Math.round(score));
  }
}

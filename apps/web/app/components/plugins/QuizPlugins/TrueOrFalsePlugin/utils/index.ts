interface ScoringParams {
  isCorrect: boolean | null;
  correctAnswerRevealed: boolean;
  wrongAttemptsCount: number;
}

export function calculateTrueFalseScore({
  isCorrect,
  correctAnswerRevealed,
  wrongAttemptsCount,
}: ScoringParams): number {
  const MAX_SCORE = 100;
  const PENALTY_PER_WRONG_ATTEMPT = 25;

  if (!isCorrect || correctAnswerRevealed) {
    return 0;
  }

  const penalty = wrongAttemptsCount * PENALTY_PER_WRONG_ATTEMPT;
  return Math.max(MAX_SCORE - penalty, 0);
}

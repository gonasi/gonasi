import type { MultipleChoiceMultipleAnswersInteractionSchemaType } from '@gonasi/schemas/plugins';

// Define the parameters type for the main scoring function
export interface ScoringParameters {
  // Core correctness indicators
  isCorrect: boolean | null;
  correctAnswersRevealed: boolean;

  // Answer analysis
  correctAnswersSelected: number;
  totalCorrectAnswers: number;
  wrongAnswersSelected: number;
  totalChoicesAvailable: number;

  // Attempt tracking
  attemptsCount: number;
  wrongAttempts?: {
    selected: string[];
    timestamp: number;
    partiallyCorrect?: boolean;
  }[];

  // Difficulty adjustment (optional)
  difficultyMultiplier?: number;
}

// Define the helper function parameters type
export interface ScoringExtractionParameters {
  state: MultipleChoiceMultipleAnswersInteractionSchemaType;
  correctAnswers: string[];
  allOptionsUuids: string[];
  difficultyMultiplier?: number;
}

// Define basic scoring parameters type
export interface BasicScoringParameters {
  correctSelected: number;
  totalCorrect: number;
  wrongSelected: number;
  totalChoices: number;
  isFullyCorrect: boolean;
  wasRevealed?: boolean;
}

/**
 * Calculates a comprehensive score for multiple choice questions with multiple answers.
 * This function provides fair scoring by considering partial correctness, wrong selections,
 * revealed answers, and the overall difficulty of the question.
 *
 * @param params Comprehensive scoring parameters
 * @returns A score between 0 and 100
 */
export function calculateMultipleChoiceMultipleAnswersScore({
  // Core correctness indicators
  isCorrect,
  correctAnswersRevealed,

  // Answer analysis
  correctAnswersSelected,
  totalCorrectAnswers,
  wrongAnswersSelected,
  totalChoicesAvailable,

  // Attempt tracking
  attemptsCount,
  wrongAttempts,

  // Difficulty adjustment (optional)
  difficultyMultiplier = 1, // 0.1 to 1
}: ScoringParameters): number {
  // Validate inputs
  if (totalCorrectAnswers <= 0 || totalChoicesAvailable <= 0) {
    return 0;
  }

  if (correctAnswersSelected < 0 || wrongAnswersSelected < 0) {
    return 0;
  }

  // If correct answers were revealed, return minimal score
  if (correctAnswersRevealed) {
    return 0;
  }

  // If user hasn't selected anything, return 0
  if (correctAnswersSelected === 0 && wrongAnswersSelected === 0) {
    return 0;
  }

  // Calculate base score components
  let score = 0;

  // 1. Correctness Score (60% of total score)
  const correctnessRatio = correctAnswersSelected / totalCorrectAnswers;
  const correctnessScore = correctnessRatio * 60;

  // 2. Precision Score (25% of total score) - penalize wrong selections
  const totalSelected = correctAnswersSelected + wrongAnswersSelected;
  const precisionRatio = totalSelected > 0 ? correctAnswersSelected / totalSelected : 0;
  const precisionScore = precisionRatio * 20;

  // 3. Efficiency Score (15% of total score) - reward fewer attempts
  let efficiencyScore = 10;
  if (attemptsCount > 1) {
    // Reduce efficiency score based on number of attempts
    const attemptPenalty = Math.min((attemptsCount - 1) * 3, 12);
    efficiencyScore = Math.max(3, efficiencyScore - attemptPenalty);
  }

  // Combine base scores
  score = correctnessScore + precisionScore + efficiencyScore;

  // 4. Bonus for complete correctness
  if (isCorrect === true && wrongAnswersSelected === 0) {
    // Perfect answer bonus
    score += 10;
  } else if (isCorrect === true && wrongAnswersSelected > 0) {
    // Complete but with wrong selections - smaller bonus
    score += 5;
  }

  // 5. Additional penalties for excessive wrong selections
  if (wrongAnswersSelected > 0) {
    const wrongSelectionRatio =
      wrongAnswersSelected / (totalChoicesAvailable - totalCorrectAnswers);
    const excessPenalty = Math.min(wrongSelectionRatio * 15, 15);
    score -= excessPenalty;
  }

  // 6. Partial credit for learning progression
  if (wrongAttempts && wrongAttempts.length > 0) {
    const partiallyCorrectAttempts = wrongAttempts.filter(
      (attempt) => attempt.partiallyCorrect === true,
    ).length;

    if (partiallyCorrectAttempts > 0) {
      // Small bonus for showing learning progression
      const progressionBonus = Math.min(partiallyCorrectAttempts * 2, 5);
      score += progressionBonus;
    }
  }

  // 7. Apply difficulty multiplier
  score *= difficultyMultiplier;

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, Math.round(score)));

  return score;
}

/**
 * Helper function to extract scoring parameters from the hook's state.
 * This bridges the gap between the hook's data structure and the scoring function.
 */
export function extractScoringParams({
  state,
  correctAnswers,
  allOptionsUuids,
  difficultyMultiplier,
}: ScoringExtractionParameters): number {
  const correctAnswersSelected = state.correctAttempt?.selected?.length || 0;

  // Calculate wrong answers by looking at all wrong attempts
  let wrongAnswersSelected = 0;

  // Count wrong selections from all attempts
  if (state.wrongAttempts && state.wrongAttempts.length > 0) {
    wrongAnswersSelected = state.wrongAttempts.reduce((total, attempt) => {
      const wrongInAttempt = attempt.selected.filter(
        (uuid: string) => !correctAnswers.includes(uuid),
      ).length;
      return total + wrongInAttempt;
    }, 0);
  }

  // Determine if fully correct by comparing correct attempt with all required answers
  const isFullyCorrect =
    state.correctAttempt?.selected?.length === correctAnswers.length &&
    state.correctAttempt.selected.every((uuid) => correctAnswers.includes(uuid));

  // Calculate total attempts (wrong attempts + 1 for the final/correct attempt if it exists)
  const totalAttempts = state.wrongAttempts.length + (state.correctAttempt ? 1 : 0);

  return calculateMultipleChoiceMultipleAnswersScore({
    isCorrect: isFullyCorrect,
    correctAnswersRevealed: state.hasRevealedCorrectAnswer,
    correctAnswersSelected,
    totalCorrectAnswers: correctAnswers.length,
    wrongAnswersSelected,
    totalChoicesAvailable: allOptionsUuids.length,
    attemptsCount: Math.max(1, totalAttempts),
    wrongAttempts: state.wrongAttempts,
    difficultyMultiplier,
  });
}

import { type FillInTheBlankStateInteractionSchemaTypes } from '@gonasi/schemas/plugins';

export type LetterFeedback = 'correct' | 'incorrect' | 'empty';

/**
 * Get letter-by-letter feedback for the user's answer (like Wordle)
 * @param userAnswer - The answer provided by the user
 * @param correctAnswer - The correct answer
 * @param caseSensitive - Whether the comparison should be case-sensitive
 * @returns Array of feedback for each position
 */
export function getLetterFeedback(
  userAnswer: string,
  correctAnswer: string,
  caseSensitive: boolean = false,
): LetterFeedback[] {
  const normalizedUserAnswer = caseSensitive ? userAnswer : userAnswer.toLowerCase();
  const normalizedCorrectAnswer = caseSensitive ? correctAnswer : correctAnswer.toLowerCase();

  // Remove spaces from both answers for comparison
  const userLetters = normalizedUserAnswer.replace(/\s/g, '').split('');
  const correctLetters = normalizedCorrectAnswer.replace(/\s/g, '').split('');

  // Pad the shorter answer with empty strings to match length
  const maxLength = Math.max(userLetters.length, correctLetters.length);
  while (userLetters.length < maxLength) userLetters.push('');
  while (correctLetters.length < maxLength) correctLetters.push('');

  // Compare letter by letter
  return userLetters.map((letter, index) => {
    if (!letter) return 'empty';
    return letter === correctLetters[index] ? 'correct' : 'incorrect';
  });
}

/**
 * Check if the user's answer is completely correct
 * @param userAnswer - The answer provided by the user
 * @param correctAnswer - The correct answer
 * @param caseSensitive - Whether the comparison should be case-sensitive
 */
export function isAnswerCorrect(
  userAnswer: string,
  correctAnswer: string,
  caseSensitive: boolean = false,
): boolean {
  const normalizedUserAnswer = caseSensitive
    ? userAnswer.trim().replace(/\s/g, '')
    : userAnswer.trim().replace(/\s/g, '').toLowerCase();
  const normalizedCorrectAnswer = caseSensitive
    ? correctAnswer.trim().replace(/\s/g, '')
    : correctAnswer.trim().replace(/\s/g, '').toLowerCase();

  return normalizedUserAnswer === normalizedCorrectAnswer;
}

/**
 * Score calculation function for Fill-in-the-Blank
 * Starts at 100 points and decreases with each wrong attempt
 * Becomes 0 after MAX_ATTEMPTS wrong attempts
 */
export function calculateFillInTheBlankScore(
  state: FillInTheBlankStateInteractionSchemaTypes,
): number {
  const MAX_SCORE = 100;
  const MAX_ATTEMPTS = 5; // After 5 wrong attempts, score becomes 0

  // No score if no correct attempt was made
  if (state.correctAttempt === null) {
    return 0;
  }

  // No score if the correct answer was revealed (not earned)
  if (state.correctAttempt?.wasRevealed) {
    return 0;
  }

  // Calculate score based on wrong attempts
  const wrongAttemptsCount = state.wrongAttempts.length;

  // If max attempts reached or exceeded, score is 0
  if (wrongAttemptsCount >= MAX_ATTEMPTS) {
    return 0;
  }

  // Calculate penalty per wrong attempt
  const penaltyPerAttempt = MAX_SCORE / MAX_ATTEMPTS;
  const totalPenalty = wrongAttemptsCount * penaltyPerAttempt;

  return Math.max(Math.round(MAX_SCORE - totalPenalty), 0);
}

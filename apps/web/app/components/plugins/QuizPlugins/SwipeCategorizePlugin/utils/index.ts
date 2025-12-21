import type { SwipeCategorizeInteractionSchemaTypes } from '@gonasi/schemas/plugins';

/**
 * Calculate the score for a swipe categorize interaction
 *
 * Scoring Logic:
 * - Since users are forced to correct wrong swipes, all cards eventually get categorized correctly
 * - Score is based on "first-try accuracy"
 * - Start at 100, deduct points for each wrong attempt
 * - Heavier penalty (15 points) since wrong direction gets blocked, forcing correction
 *
 * @param state - The current interaction state
 * @param totalCards - Total number of cards in the plugin
 * @returns Score between 30-100 (minimum 30 if completed, 10 if in progress)
 */
export function calculateSwipeCategorizeScore(
  state: SwipeCategorizeInteractionSchemaTypes,
  totalCards: number,
): number {
  const totalSwiped = state.leftBucket.length + state.rightBucket.length;
  const wrongSwipeCount = state.wrongSwipes.length;

  // If nothing swiped yet, return 0
  if (totalSwiped === 0) return 0;

  // Calculate first-try accuracy
  const firstTryCorrect = totalSwiped - wrongSwipeCount;
  const firstTryAccuracy = (firstTryCorrect / totalCards) * 100;

  // Penalty: 15 points per wrong swipe (since they're forced to correct it)
  const penalty = wrongSwipeCount * 15;

  // Calculate score starting from 100
  let score = 100 - penalty;

  // If not all cards done yet, scale by progress
  if (totalSwiped < totalCards) {
    // Partial completion: scale the score by completion percentage
    const completionRate = totalSwiped / totalCards;
    score = Math.max(firstTryAccuracy - penalty * completionRate, 10);
  } else {
    // All cards done: minimum score of 30 (they eventually got everything right)
    score = Math.max(score, 30);
  }

  // Cap at 100
  return Math.min(Math.round(score), 100);
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp!;
  }
  return shuffled;
}

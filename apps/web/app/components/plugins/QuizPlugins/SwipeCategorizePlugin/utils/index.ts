import type { SwipeCategorizeInteractionSchemaTypes } from '@gonasi/schemas/plugins';

/**
 * Calculate the score for a swipe categorize interaction
 *
 * Scoring Logic:
 * - Follows the same pattern as other quiz plugins (True/False, Fill in the Blank)
 * - Start at 100, deduct 20 points for each wrong swipe
 * - Since users are forced to correct wrong swipes, all cards eventually get categorized correctly
 * - Maximum 5 wrong swipes before score reaches 0
 *
 * @param state - The current interaction state
 * @param totalCards - Total number of cards in the plugin
 * @returns Score between 0-100
 */
export function calculateSwipeCategorizeScore(
  state: SwipeCategorizeInteractionSchemaTypes,
  totalCards: number,
): number {
  const MAX_SCORE = 100;
  const PENALTY_PER_WRONG_SWIPE = 20;

  const totalSwiped = state.leftBucket.length + state.rightBucket.length;
  const wrongSwipeCount = state.wrongSwipes.length;

  // No score if nothing swiped yet
  if (totalSwiped === 0) return 0;

  // Calculate penalty based on wrong swipes
  const penalty = wrongSwipeCount * PENALTY_PER_WRONG_SWIPE;

  // Simple scoring: 100 - penalty, minimum 0
  return Math.max(MAX_SCORE - penalty, 0);
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

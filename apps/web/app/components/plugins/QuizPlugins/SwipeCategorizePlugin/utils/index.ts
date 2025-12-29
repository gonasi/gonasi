import type { SwipeCategorizeInteractionSchemaTypes } from '@gonasi/schemas/plugins';

/**
 * Calculate the score for a swipe categorize interaction
 *
 * Scoring Logic:
 * - Proportional penalty system that considers total number of cards
 * - Error rate = wrong swipes / total cards
 * - Penalty scales with error rate (67% error rate = 0 score)
 * - Fair for both small (3 cards) and large (20 cards) sets
 *
 * Examples:
 * - 3 cards, 0 wrong = 100 points (0% error)
 * - 3 cards, 1 wrong = 50 points (33% error)
 * - 5 cards, 1 wrong = 70 points (20% error)
 * - 10 cards, 2 wrong = 70 points (20% error)
 * - 20 cards, 5 wrong = 62 points (25% error)
 * - Any set, 67% error = 0 points
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
  const PENALTY_MULTIPLIER = 1.5; // 67% error rate = 100% penalty (score of 0)

  const totalSwiped = state.leftBucket.length + state.rightBucket.length;
  const wrongSwipeCount = state.wrongSwipes.length;

  // No score if nothing swiped yet
  if (totalSwiped === 0) return 0;

  // Prevent division by zero
  if (totalCards === 0) return 0;

  // Calculate error rate (percentage of cards with wrong swipes)
  const errorRate = wrongSwipeCount / totalCards;

  // Calculate penalty as a percentage (0-100)
  const penaltyPercentage = Math.min(errorRate * PENALTY_MULTIPLIER, 1) * MAX_SCORE;

  // Calculate final score
  const finalScore = Math.max(MAX_SCORE - penaltyPercentage, 0);

  // Round to whole number for cleaner display
  return Math.round(finalScore);
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

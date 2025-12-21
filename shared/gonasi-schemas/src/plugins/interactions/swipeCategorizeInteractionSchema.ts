import { z } from 'zod';

// ============================================================================
// Swipe Categorize Interaction Schema
// ============================================================================

export const SwipeCategorizeInteractionSchema = z.object({
  plugin_type: z.literal('swipe_categorize'),

  // Current card being shown
  currentCardIndex: z.number().int().min(0).default(0),

  // Cards swiped to left bucket
  leftBucket: z
    .array(
      z.object({
        cardId: z.string().uuid(),
        timestamp: z.number(),
        wasCorrect: z.boolean(),
      }),
    )
    .default([]),

  // Cards swiped to right bucket
  rightBucket: z
    .array(
      z.object({
        cardId: z.string().uuid(),
        timestamp: z.number(),
        wasCorrect: z.boolean(),
      }),
    )
    .default([]),

  // Track all wrong swipes for penalty calculation
  wrongSwipes: z
    .array(
      z.object({
        cardId: z.string().uuid(),
        swipedTo: z.enum(['left', 'right']),
        correctCategory: z.enum(['left', 'right']),
        timestamp: z.number(),
      }),
    )
    .default([]),

  // Track all attempts (for analytics)
  allAttempts: z
    .array(
      z.object({
        cardId: z.string().uuid(),
        swipedTo: z.enum(['left', 'right']),
        timestamp: z.number(),
        isCorrect: z.boolean(),
      }),
    )
    .default([]),
});

export type SwipeCategorizeInteractionSchemaTypes = z.infer<typeof SwipeCategorizeInteractionSchema>;

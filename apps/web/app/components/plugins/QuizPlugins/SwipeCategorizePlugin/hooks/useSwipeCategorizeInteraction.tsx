import { useCallback, useMemo, useState } from 'react';

import {
  type SwipeCategorizeContentSchemaTypes,
  SwipeCategorizeInteractionSchema,
  type SwipeCategorizeInteractionSchemaTypes,
} from '@gonasi/schemas/plugins';

import { calculateSwipeCategorizeScore } from '../utils';

const schema = SwipeCategorizeInteractionSchema;

const getTimestamp = () => Date.now();

export function useSwipeCategorizeInteraction(
  initial: SwipeCategorizeInteractionSchemaTypes | null,
  content: SwipeCategorizeContentSchemaTypes,
) {
  const cards = content.cards;
  // Memoize defaultState to prevent creating new object on every render
  const defaultState: SwipeCategorizeInteractionSchemaTypes = useMemo(
    () =>
      schema.parse({
        plugin_type: 'swipe_categorize',
      }),
    [],
  );

  const [state, setState] = useState<SwipeCategorizeInteractionSchemaTypes>(() =>
    schema.parse(initial ?? { plugin_type: 'swipe_categorize' }),
  );

  // ============================================================================
  // Derived State
  // ============================================================================

  const isCompleted = useMemo(() => {
    const totalSwiped = state.leftBucket.length + state.rightBucket.length;
    return totalSwiped === cards.length;
  }, [state.leftBucket.length, state.rightBucket.length, cards.length]);

  const canInteract = useMemo(() => {
    return !isCompleted && state.currentCardIndex < cards.length;
  }, [isCompleted, state.currentCardIndex, cards.length]);

  const currentCard = useMemo(() => {
    if (state.currentCardIndex >= cards.length) return null;
    return cards[state.currentCardIndex];
  }, [state.currentCardIndex, cards]);

  const progress = useMemo(() => {
    if (cards.length === 0) return 0;
    const totalSwiped = state.leftBucket.length + state.rightBucket.length;
    return (totalSwiped / cards.length) * 100;
  }, [state.leftBucket.length, state.rightBucket.length, cards.length]);

  const score = useMemo(() => {
    return calculateSwipeCategorizeScore(state, cards.length);
  }, [state, cards.length]);

  const correctSwipes = useMemo(() => {
    return (
      state.leftBucket.filter((item) => item.wasCorrect).length +
      state.rightBucket.filter((item) => item.wasCorrect).length
    );
  }, [state.leftBucket, state.rightBucket]);

  const wrongSwipesCount = useMemo(() => {
    return state.wrongSwipes.length;
  }, [state.wrongSwipes.length]);

  // ============================================================================
  // Actions
  // ============================================================================

  const swipeLeft = useCallback(() => {
    if (!canInteract || !currentCard) return;

    const timestamp = getTimestamp();
    const wasCorrect = currentCard.correctCategory === 'left';

    setState((prev) => {
      const newLeftBucket = [
        ...prev.leftBucket,
        {
          cardId: currentCard.id,
          timestamp,
          wasCorrect,
        },
      ];

      const newAllAttempts = [
        ...prev.allAttempts,
        {
          cardId: currentCard.id,
          swipedTo: 'left' as const,
          timestamp,
          isCorrect: wasCorrect,
        },
      ];

      // Track wrong swipes
      const newWrongSwipes = wasCorrect
        ? prev.wrongSwipes
        : [
            ...prev.wrongSwipes,
            {
              cardId: currentCard.id,
              swipedTo: 'left' as const,
              correctCategory: currentCard.correctCategory,
              timestamp,
            },
          ];

      return {
        ...prev,
        currentCardIndex: prev.currentCardIndex + 1,
        leftBucket: newLeftBucket,
        wrongSwipes: newWrongSwipes,
        allAttempts: newAllAttempts,
      };
    });
  }, [canInteract, currentCard]);

  const swipeRight = useCallback(() => {
    if (!canInteract || !currentCard) return;

    const timestamp = getTimestamp();
    const wasCorrect = currentCard.correctCategory === 'right';

    setState((prev) => {
      const newRightBucket = [
        ...prev.rightBucket,
        {
          cardId: currentCard.id,
          timestamp,
          wasCorrect,
        },
      ];

      const newAllAttempts = [
        ...prev.allAttempts,
        {
          cardId: currentCard.id,
          swipedTo: 'right' as const,
          timestamp,
          isCorrect: wasCorrect,
        },
      ];

      // Track wrong swipes
      const newWrongSwipes = wasCorrect
        ? prev.wrongSwipes
        : [
            ...prev.wrongSwipes,
            {
              cardId: currentCard.id,
              swipedTo: 'right' as const,
              correctCategory: currentCard.correctCategory,
              timestamp,
            },
          ];

      return {
        ...prev,
        currentCardIndex: prev.currentCardIndex + 1,
        rightBucket: newRightBucket,
        wrongSwipes: newWrongSwipes,
        allAttempts: newAllAttempts,
      };
    });
  }, [canInteract, currentCard]);

  const trackWrongSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (!currentCard) return;

      const timestamp = getTimestamp();

      setState((prev) => ({
        ...prev,
        wrongSwipes: [
          ...prev.wrongSwipes,
          {
            cardId: currentCard.id,
            swipedTo: direction,
            correctCategory: currentCard.correctCategory,
            timestamp,
          },
        ],
        allAttempts: [
          ...prev.allAttempts,
          {
            cardId: currentCard.id,
            swipedTo: direction,
            timestamp,
            isCorrect: false,
          },
        ],
      }));
    },
    [currentCard],
  );

  const reset = useCallback(() => {
    setState(defaultState);
  }, [defaultState]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    state,

    // Derived state
    isCompleted,
    canInteract,
    currentCard,
    progress,
    score,
    correctSwipes,
    wrongSwipesCount,

    // Actions
    swipeLeft,
    swipeRight,
    trackWrongSwipe,
    reset,
  };
}

export type SwipeCategorizeInteractionReturn = ReturnType<typeof useSwipeCategorizeInteraction>;

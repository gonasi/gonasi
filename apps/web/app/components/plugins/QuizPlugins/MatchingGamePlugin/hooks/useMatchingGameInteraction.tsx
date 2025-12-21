import { useCallback, useMemo, useState } from 'react';

import {
  MatchingGameInteractionSchema,
  type MatchingGameInteractionSchemaTypes,
  type MatchingPairSchemaTypes,
} from '@gonasi/schemas/plugins';

import { calculateMatchingGameScore } from '../utils';

const schema = MatchingGameInteractionSchema;

const getTimestamp = () => Date.now();

export function useMatchingGameInteraction(
  initial: MatchingGameInteractionSchemaTypes | null,
  pairs: MatchingPairSchemaTypes[],
) {
  const defaultState: MatchingGameInteractionSchemaTypes = schema.parse({
    plugin_type: 'matching_game',
  });

  const [state, setState] = useState<MatchingGameInteractionSchemaTypes>(() =>
    schema.parse(initial ?? { plugin_type: 'matching_game' }),
  );

  // ============================================================================
  // Derived State
  // ============================================================================

  const isCompleted = useMemo(() => {
    return state.matchedPairs.length === pairs.length;
  }, [state.matchedPairs.length, pairs.length]);

  const canInteract = useMemo(() => {
    return !isCompleted;
  }, [isCompleted]);

  const attemptsCount = useMemo(() => {
    // Count only wrong attempts
    // First wrong match = 1 attempt, second wrong match = 2 attempts, etc.
    const totalWrongAttempts = state.wrongAttemptsPerLeftItem.reduce(
      (sum, entry) => sum + entry.wrongRightIds.length,
      0,
    );
    return totalWrongAttempts;
  }, [state.wrongAttemptsPerLeftItem]);

  const score = useMemo(() => {
    return calculateMatchingGameScore(state, pairs.length);
  }, [state, pairs.length]);

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const isLeftItemSelected = useCallback(
    (leftId: string) => {
      return state.selectedLeftId === leftId;
    },
    [state.selectedLeftId],
  );

  const isLeftItemMatched = useCallback(
    (leftId: string) => {
      return state.matchedPairs.some((pair) => pair.leftId === leftId);
    },
    [state.matchedPairs],
  );

  const isRightItemMatched = useCallback(
    (rightId: string) => {
      return state.matchedPairs.some((pair) => pair.rightId === rightId);
    },
    [state.matchedPairs],
  );

  const isRightItemDisabled = useCallback(
    (rightId: string) => {
      // Already matched
      if (state.matchedPairs.some((pair) => pair.rightId === rightId)) {
        return true;
      }

      // No left item selected - can't interact with right items
      if (!state.selectedLeftId) {
        return true;
      }

      // Check if this right item was previously attempted wrong for current left selection
      const wrongForLeft = state.wrongAttemptsPerLeftItem.find(
        (entry) => entry.leftId === state.selectedLeftId,
      );

      return wrongForLeft?.wrongRightIds.includes(rightId) ?? false;
    },
    [state.selectedLeftId, state.matchedPairs, state.wrongAttemptsPerLeftItem],
  );

  const isRightItemWrong = useCallback(
    (rightId: string) => {
      // Only show as wrong if there's a current left selection and it was attempted
      if (!state.selectedLeftId) return false;

      const wrongForLeft = state.wrongAttemptsPerLeftItem.find(
        (entry) => entry.leftId === state.selectedLeftId,
      );

      return wrongForLeft?.wrongRightIds.includes(rightId) ?? false;
    },
    [state.selectedLeftId, state.wrongAttemptsPerLeftItem],
  );

  // ============================================================================
  // Actions
  // ============================================================================

  const selectLeftItem = useCallback(
    (leftId: string) => {
      if (!canInteract) return;

      // Can't select a matched left item
      if (isLeftItemMatched(leftId)) return;

      setState((prev) => ({
        ...prev,
        // Toggle selection (deselect if same item clicked)
        selectedLeftId: prev.selectedLeftId === leftId ? null : leftId,
      }));
    },
    [canInteract, isLeftItemMatched],
  );

  const selectRightItem = useCallback(
    (rightId: string) => {
      if (!state.selectedLeftId || !canInteract) return;

      // Can't select a disabled right item
      if (isRightItemDisabled(rightId)) return;

      const selectedLeftId = state.selectedLeftId;

      // Find the correct pair for the selected left item
      const correctPair = pairs.find((pair) => pair.id === selectedLeftId);

      if (!correctPair) return;

      const timestamp = getTimestamp();

      // Check if the match is correct
      // Note: We're assuming pair.id represents the leftId and we need to match rightId
      // Since pair.id is the same for both left and right items in the same pair
      const isCorrect = correctPair.id === rightId;

      setState((prev) => {
        if (isCorrect) {
          // Correct match!
          const newMatchedPairs = [
            ...prev.matchedPairs,
            { leftId: selectedLeftId, rightId, timestamp },
          ];

          return {
            ...prev,
            selectedLeftId: null, // Deselect after correct match
            matchedPairs: newMatchedPairs,
            allAttempts: [
              ...prev.allAttempts,
              { leftId: selectedLeftId, rightId, timestamp, isCorrect: true },
            ],
          };
        } else {
          // Wrong match
          const existingEntry = prev.wrongAttemptsPerLeftItem.find(
            (entry) => entry.leftId === selectedLeftId,
          );

          let newWrongAttempts;
          if (existingEntry) {
            // Add to existing wrong attempts for this left item
            newWrongAttempts = prev.wrongAttemptsPerLeftItem.map((entry) =>
              entry.leftId === selectedLeftId
                ? { ...entry, wrongRightIds: [...entry.wrongRightIds, rightId] }
                : entry,
            );
          } else {
            // Create new entry for this left item
            newWrongAttempts = [
              ...prev.wrongAttemptsPerLeftItem,
              { leftId: selectedLeftId, wrongRightIds: [rightId] },
            ];
          }

          return {
            ...prev,
            selectedLeftId: null, // Deselect after wrong attempt
            wrongAttemptsPerLeftItem: newWrongAttempts,
            allAttempts: [
              ...prev.allAttempts,
              { leftId: selectedLeftId, rightId, timestamp, isCorrect: false },
            ],
          };
        }
      });
    },
    [state.selectedLeftId, canInteract, pairs, isRightItemDisabled],
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
    attemptsCount,
    score,

    // Helper functions
    isLeftItemSelected,
    isLeftItemMatched,
    isRightItemMatched,
    isRightItemDisabled,
    isRightItemWrong,

    // Actions
    selectLeftItem,
    selectRightItem,
    reset,
  };
}

export type MatchingGameInteractionReturn = ReturnType<typeof useMatchingGameInteraction>;

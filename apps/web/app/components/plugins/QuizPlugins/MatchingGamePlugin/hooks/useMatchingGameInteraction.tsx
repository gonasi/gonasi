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
    // Count wrong attempts from both directions
    const leftToRightWrong = state.wrongAttemptsPerLeftItem.reduce(
      (sum, entry) => sum + entry.wrongRightIds.length,
      0,
    );
    const rightToLeftWrong = state.wrongAttemptsPerRightItem.reduce(
      (sum, entry) => sum + entry.wrongLeftIds.length,
      0,
    );
    return leftToRightWrong + rightToLeftWrong;
  }, [state.wrongAttemptsPerLeftItem, state.wrongAttemptsPerRightItem]);

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

  const isRightItemSelected = useCallback(
    (rightId: string) => {
      return state.selectedRightId === rightId;
    },
    [state.selectedRightId],
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

  const isLeftItemDisabled = useCallback(
    (leftId: string) => {
      // Already matched
      if (state.matchedPairs.some((pair) => pair.leftId === leftId)) {
        return true;
      }

      // Check if a right item is selected
      if (state.selectedRightId) {
        // Check if this combination was attempted wrong from right-to-left
        const wrongForRight = state.wrongAttemptsPerRightItem.find(
          (entry) => entry.rightId === state.selectedRightId,
        );
        if (wrongForRight?.wrongLeftIds.includes(leftId)) {
          return true;
        }

        // Also check if this combination was attempted wrong from left-to-right
        const wrongForLeft = state.wrongAttemptsPerLeftItem.find(
          (entry) => entry.leftId === leftId,
        );
        if (wrongForLeft?.wrongRightIds.includes(state.selectedRightId)) {
          return true;
        }
      }

      // Not disabled if no right item is selected (allows left-to-right selection)
      return false;
    },
    [
      state.selectedRightId,
      state.matchedPairs,
      state.wrongAttemptsPerRightItem,
      state.wrongAttemptsPerLeftItem,
    ],
  );

  const isRightItemDisabled = useCallback(
    (rightId: string) => {
      // Already matched
      if (state.matchedPairs.some((pair) => pair.rightId === rightId)) {
        return true;
      }

      // Check if a left item is selected
      if (state.selectedLeftId) {
        // Check if this combination was attempted wrong from left-to-right
        const wrongForLeft = state.wrongAttemptsPerLeftItem.find(
          (entry) => entry.leftId === state.selectedLeftId,
        );
        if (wrongForLeft?.wrongRightIds.includes(rightId)) {
          return true;
        }

        // Also check if this combination was attempted wrong from right-to-left
        const wrongForRight = state.wrongAttemptsPerRightItem.find(
          (entry) => entry.rightId === rightId,
        );
        if (wrongForRight?.wrongLeftIds.includes(state.selectedLeftId)) {
          return true;
        }
      }

      // Not disabled if no left item is selected (allows right-to-left selection)
      return false;
    },
    [
      state.selectedLeftId,
      state.matchedPairs,
      state.wrongAttemptsPerLeftItem,
      state.wrongAttemptsPerRightItem,
    ],
  );

  const isLeftItemWrong = useCallback(
    (leftId: string) => {
      // Show as wrong if there's a current right selection and this combination was attempted wrong
      if (!state.selectedRightId) return false;

      // Check if attempted wrong from right-to-left
      const wrongForRight = state.wrongAttemptsPerRightItem.find(
        (entry) => entry.rightId === state.selectedRightId,
      );
      if (wrongForRight?.wrongLeftIds.includes(leftId)) {
        return true;
      }

      // Also check if attempted wrong from left-to-right
      const wrongForLeft = state.wrongAttemptsPerLeftItem.find((entry) => entry.leftId === leftId);
      return wrongForLeft?.wrongRightIds.includes(state.selectedRightId) ?? false;
    },
    [state.selectedRightId, state.wrongAttemptsPerRightItem, state.wrongAttemptsPerLeftItem],
  );

  const isRightItemWrong = useCallback(
    (rightId: string) => {
      // Show as wrong if there's a current left selection and this combination was attempted wrong
      if (!state.selectedLeftId) return false;

      // Check if attempted wrong from left-to-right
      const wrongForLeft = state.wrongAttemptsPerLeftItem.find(
        (entry) => entry.leftId === state.selectedLeftId,
      );
      if (wrongForLeft?.wrongRightIds.includes(rightId)) {
        return true;
      }

      // Also check if attempted wrong from right-to-left
      const wrongForRight = state.wrongAttemptsPerRightItem.find(
        (entry) => entry.rightId === rightId,
      );
      return wrongForRight?.wrongLeftIds.includes(state.selectedLeftId) ?? false;
    },
    [state.selectedLeftId, state.wrongAttemptsPerLeftItem, state.wrongAttemptsPerRightItem],
  );

  // ============================================================================
  // Actions
  // ============================================================================

  // Helper function to attempt a match between left and right items
  const attemptMatch = useCallback(
    (leftId: string, rightId: string) => {
      // Find the correct pair for the left item
      const correctPair = pairs.find((pair) => pair.id === leftId);

      if (!correctPair) return;

      const timestamp = getTimestamp();

      // Check if the match is correct
      // Note: pair.id is the same for both left and right items in the same pair
      const isCorrect = correctPair.id === rightId;

      setState((prev) => {
        if (isCorrect) {
          // Correct match!
          return {
            ...prev,
            selectedLeftId: null, // Deselect both items after match
            selectedRightId: null,
            matchedPairs: [...prev.matchedPairs, { leftId, rightId, timestamp }],
            allAttempts: [...prev.allAttempts, { leftId, rightId, timestamp, isCorrect: true }],
          };
        } else {
          // Wrong match - track which direction the attempt came from
          let newWrongAttemptsLeft = prev.wrongAttemptsPerLeftItem;
          let newWrongAttemptsRight = prev.wrongAttemptsPerRightItem;

          // Track wrong attempt for left item (when selecting left-to-right)
          if (prev.selectedLeftId) {
            const existingEntry = prev.wrongAttemptsPerLeftItem.find(
              (entry) => entry.leftId === leftId,
            );

            if (existingEntry) {
              newWrongAttemptsLeft = prev.wrongAttemptsPerLeftItem.map((entry) =>
                entry.leftId === leftId
                  ? { ...entry, wrongRightIds: [...entry.wrongRightIds, rightId] }
                  : entry,
              );
            } else {
              newWrongAttemptsLeft = [
                ...prev.wrongAttemptsPerLeftItem,
                { leftId, wrongRightIds: [rightId] },
              ];
            }
          }

          // Track wrong attempt for right item (when selecting right-to-left)
          if (prev.selectedRightId) {
            const existingEntry = prev.wrongAttemptsPerRightItem.find(
              (entry) => entry.rightId === rightId,
            );

            if (existingEntry) {
              newWrongAttemptsRight = prev.wrongAttemptsPerRightItem.map((entry) =>
                entry.rightId === rightId
                  ? { ...entry, wrongLeftIds: [...entry.wrongLeftIds, leftId] }
                  : entry,
              );
            } else {
              newWrongAttemptsRight = [
                ...prev.wrongAttemptsPerRightItem,
                { rightId, wrongLeftIds: [leftId] },
              ];
            }
          }

          return {
            ...prev,
            selectedLeftId: null, // Deselect both items after wrong attempt
            selectedRightId: null,
            wrongAttemptsPerLeftItem: newWrongAttemptsLeft,
            wrongAttemptsPerRightItem: newWrongAttemptsRight,
            allAttempts: [...prev.allAttempts, { leftId, rightId, timestamp, isCorrect: false }],
          };
        }
      });
    },
    [pairs],
  );

  const selectLeftItem = useCallback(
    (leftId: string) => {
      if (!canInteract) return;

      // Can't select a matched left item
      if (isLeftItemMatched(leftId)) return;

      // If a right item is already selected, attempt match immediately
      if (state.selectedRightId) {
        // Check if this left item was previously attempted wrong for current right selection
        if (!isLeftItemDisabled(leftId)) {
          attemptMatch(leftId, state.selectedRightId);
        }
        return;
      }

      // Otherwise, toggle left item selection (traditional behavior)
      setState((prev) => ({
        ...prev,
        // Toggle selection (deselect if same item clicked)
        selectedLeftId: prev.selectedLeftId === leftId ? null : leftId,
        // Clear any right selection when selecting from left
        selectedRightId: null,
      }));
    },
    [canInteract, isLeftItemMatched, isLeftItemDisabled, state.selectedRightId, attemptMatch],
  );

  const selectRightItem = useCallback(
    (rightId: string) => {
      if (!canInteract) return;

      // Can't select a matched right item
      if (isRightItemMatched(rightId)) return;

      // If a left item is already selected, attempt match immediately
      if (state.selectedLeftId) {
        // Check if this right item was previously attempted wrong for current left selection
        if (!isRightItemDisabled(rightId)) {
          attemptMatch(state.selectedLeftId, rightId);
        }
        return;
      }

      // Otherwise, toggle right item selection (NEW bidirectional behavior)
      setState((prev) => ({
        ...prev,
        // Toggle selection (deselect if same item clicked)
        selectedRightId: prev.selectedRightId === rightId ? null : rightId,
        // Clear any left selection when selecting from right
        selectedLeftId: null,
      }));
    },
    [canInteract, isRightItemMatched, isRightItemDisabled, state.selectedLeftId, attemptMatch],
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
    isRightItemSelected,
    isLeftItemMatched,
    isRightItemMatched,
    isLeftItemDisabled,
    isRightItemDisabled,
    isLeftItemWrong,
    isRightItemWrong,

    // Actions
    selectLeftItem,
    selectRightItem,
    reset,
  };
}

export type MatchingGameInteractionReturn = ReturnType<typeof useMatchingGameInteraction>;

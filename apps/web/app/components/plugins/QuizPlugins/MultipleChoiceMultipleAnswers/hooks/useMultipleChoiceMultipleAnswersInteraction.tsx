import { useCallback, useEffect, useState } from 'react';
import type { z } from 'zod';

import { MultipleChoiceMultipleAnswersInteractionSchema } from '@gonasi/schemas/plugins';

const schema = MultipleChoiceMultipleAnswersInteractionSchema;

type InteractionState = z.infer<typeof schema>;

const getTimestamp = () => Date.now();

/**
 * Custom hook to manage a multiple choice multiple answers quiz interaction state.
 * Uses UUIDs exclusively for tracking choices instead of array indexes.
 */
export function useMultipleChoiceMultipleAnswersInteraction(
  correctAnswers: string[],
  initial?: Partial<InteractionState>,
) {
  const [state, setState] = useState<InteractionState>(() =>
    schema.parse({
      ...initial,
      interactionType: 'multiple_choice_multiple',
    }),
  );

  const [selectedOptionsUuids, setSelectedOptionsUuids] = useState<string[] | null>(null);
  const [disabledOptionsUuids, setDisabledOptionsUuids] = useState<string[] | null>(null);
  const [remainingCorrectToSelect, setRemainingCorrectToSelect] = useState<number>(
    correctAnswers.length,
  );
  const [hasChecked, setHasChecked] = useState(false);

  // Track how many more selections user can make
  const canSelectMore = selectedOptionsUuids
    ? selectedOptionsUuids.length <
      correctAnswers.length - (state.correctAttempt?.selected?.length || 0)
    : true;

  /**
   * Handles user toggling of options by UUID.
   * If the answer has already been checked, selection is disabled.
   * Limits selections to match the number of correct answers.
   */
  const selectOption = useCallback(
    (uuid: string) => {
      if (hasChecked) return;

      setSelectedOptionsUuids((prev) => {
        const prevSet = new Set(prev ?? []);

        // If already selected, remove it
        if (prevSet.has(uuid)) {
          prevSet.delete(uuid);
        }
        // Only add if we haven't reached the limit
        else if (prevSet.size < remainingCorrectToSelect) {
          prevSet.add(uuid);
        }

        const updated = Array.from(prevSet);
        return updated.length === 0 ? null : updated;
      });
    },
    [hasChecked, remainingCorrectToSelect],
  );

  /**
   * Compares two arrays regardless of order.
   */
  const areArraysEqual = (a: string[] | null, b: string[]) => {
    if (!a || a.length !== b.length) return false;
    const aSorted = [...a].sort();
    const bSorted = [...b].sort();
    return aSorted.every((val, idx) => val === bSorted[idx]);
  };

  /**
   * Checks the user's selected answers against the correct answer UUIDs.
   * After checking, disables non-selected options and updates remaining correct answers needed.
   */
  const checkAnswer = useCallback(() => {
    if (!selectedOptionsUuids || selectedOptionsUuids.length === 0) return;

    const timestamp = getTimestamp();
    setHasChecked(true);

    setState((prev) => {
      // Separate selected options into correct and wrong
      const correctSelectedThisRound = selectedOptionsUuids.filter((uuid) =>
        correctAnswers.includes(uuid),
      );

      const wrongSelectedThisRound = selectedOptionsUuids.filter(
        (uuid) => !correctAnswers.includes(uuid),
      );

      // Track all correct options selected across attempts
      const previousCorrectSelected = prev.correctAttempt?.selected ?? [];

      // Always accumulate correct selections from this round,
      // even if wrong options were also selected
      const updatedCorrectSelected = Array.from(
        new Set([...previousCorrectSelected, ...correctSelectedThisRound]),
      );

      // Determine if the answer is fully correct by comparing accumulated
      // correct selections with all required correct answers
      const isFullyCorrect = areArraysEqual(
        updatedCorrectSelected.slice().sort(),
        correctAnswers.slice().sort(),
      );

      // Determine if this specific selection contains any wrong answers
      const hasWrongAnswers = wrongSelectedThisRound.length > 0;

      return {
        ...prev,
        selectedOptions: selectedOptionsUuids, // Update to match schema
        isCorrect: isFullyCorrect,
        continue: isFullyCorrect,
        canShowContinueButton: isFullyCorrect,
        canShowCorrectAnswer: true,
        canShowExplanationButton: true,
        correctAttempt: {
          selected: updatedCorrectSelected,
          timestamp: isFullyCorrect ? timestamp : (prev.correctAttempt?.timestamp ?? timestamp),
        },
        // Always track wrong attempts if any wrong options were selected
        wrongAttempts: hasWrongAnswers
          ? [
              ...prev.wrongAttempts,
              {
                selected: selectedOptionsUuids,
                timestamp,
                partiallyCorrect: correctSelectedThisRound.length > 0, // Track if there were some correct answers
              },
            ]
          : prev.wrongAttempts,
        attemptsCount: prev.attemptsCount + 1,
      };
    });

    // Update remaining correct answers to select
    setRemainingCorrectToSelect((prev) => {
      const correctSelected = selectedOptionsUuids.filter((uuid) =>
        correctAnswers.includes(uuid),
      ).length;
      return Math.max(0, prev - correctSelected);
    });

    // Clear selections for next round
    setSelectedOptionsUuids(null);
    setHasChecked(false);
  }, [selectedOptionsUuids, correctAnswers]);

  /**
   * Resets correctness flag for another try and clears disabled options.
   */
  const tryAgain = useCallback(() => {
    setHasChecked(false);
    setDisabledOptionsUuids(null);
    setState((prev) => ({
      ...prev,
      isCorrect: null,
    }));
  }, []);

  /**
   * Marks correct answer as revealed.
   */
  const revealCorrectAnswer = useCallback(() => {
    const timestamp = getTimestamp();

    setState((prev) => ({
      ...prev,
      correctAnswerRevealed: true,
      selectedOptions: correctAnswers, // Update to match schema
      isCorrect: true,
      continue: true,
      canShowContinueButton: true,
      canShowCorrectAnswer: true,
      canShowExplanationButton: true,
      correctAttempt: { selected: correctAnswers, timestamp },
    }));

    setRemainingCorrectToSelect(0);
  }, [correctAnswers]);

  /**
   * Skips current interaction without answering.
   */
  const skip = useCallback(() => {
    setState((prev) => ({
      ...prev,
      continue: true,
      canShowContinueButton: true,
      canShowCorrectAnswer: true,
    }));
  }, []);

  /**
   * Resets interaction completely.
   */
  const reset = useCallback(() => {
    setState(() =>
      schema.parse({
        interactionType: 'multiple_choice_multiple',
      }),
    );
    setSelectedOptionsUuids(null);
    setDisabledOptionsUuids(null);
    setRemainingCorrectToSelect(correctAnswers.length);
    setHasChecked(false);
  }, [correctAnswers.length]);

  // When correctAttempt changes, update remaining correct answers to select
  useEffect(() => {
    if (state.correctAttempt?.selected) {
      const correctRemaining = correctAnswers.length - state.correctAttempt.selected.length;
      setRemainingCorrectToSelect(correctRemaining);
    }
  }, [state.correctAttempt?.selected, correctAnswers.length]);

  return {
    state,
    selectedOptionsUuids,
    disabledOptionsUuids,
    remainingCorrectToSelect,
    canSelectMore,
    selectOption,
    checkAnswer,
    revealCorrectAnswer,
    skip,
    reset,
    hasChecked,
    tryAgain,
  };
}

// Inferred return type alias
export type MultipleChoiceMultipleAnswersInteractionReturn = ReturnType<
  typeof useMultipleChoiceMultipleAnswersInteraction
>;

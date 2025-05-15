import { useCallback, useEffect, useState } from 'react';
import type { z } from 'zod';

import { MultipleChoiceMultipleAnswersInteractionSchema } from '@gonasi/schemas/plugins';

const schema = MultipleChoiceMultipleAnswersInteractionSchema;

type InteractionState = z.infer<typeof schema>;

const getTimestamp = () => Date.now();

/**
 * Custom hook to manage a multiple choice multiple answers quiz interaction state.
 */
export function useMultipleChoiceMultipleAnswersInteraction(
  correctAnswers: number[],
  initial?: Partial<InteractionState>,
) {
  const [state, setState] = useState<InteractionState>(() =>
    schema.parse({
      ...initial,
      interactionType: 'multiple_choice_multiple',
    }),
  );

  const [selectedOptionsIndex, setSelectedOptionsIndex] = useState<number[] | null>(null);
  const [disabledOptionsIndex, setDisabledOptionsIndex] = useState<number[] | null>(null);
  const [remainingCorrectToSelect, setRemainingCorrectToSelect] = useState<number>(
    correctAnswers.length,
  );
  const [hasChecked, setHasChecked] = useState(false);

  // Track how many more selections user can make
  const canSelectMore = selectedOptionsIndex
    ? selectedOptionsIndex.length <
      correctAnswers.length - (state.correctAttempt?.selected?.length || 0)
    : true;

  /**
   * Handles user toggling of one or more options by index.
   * If the answer has already been checked, selection is disabled.
   * Limits selections to match the number of correct answers.
   */
  const selectOptions = useCallback(
    (selections: number | number[]) => {
      if (hasChecked) return;

      const selectionArray = Array.isArray(selections) ? selections : [selections];

      setSelectedOptionsIndex((prev) => {
        const prevSet = new Set(prev ?? []);

        for (const index of selectionArray) {
          // If already selected, remove it
          if (prevSet.has(index)) {
            prevSet.delete(index);
          }
          // Only add if we haven't reached the limit or if we're toggling off
          else if (prevSet.size < remainingCorrectToSelect) {
            prevSet.add(index);
          }
        }

        const updated = Array.from(prevSet).sort((a, b) => a - b);
        return updated.length === 0 ? null : updated;
      });
    },
    [hasChecked, remainingCorrectToSelect],
  );

  /**
   * Compares two arrays regardless of order.
   */
  const areArraysEqual = (a: number[] | null, b: number[]) => {
    if (!a || a.length !== b.length) return false;
    const aSorted = [...a].sort();
    const bSorted = [...b].sort();
    return aSorted.every((val, idx) => val === bSorted[idx]);
  };

  /**
   * Checks the user's selected answers against the correct answer indexes.
   * After checking, disables non-selected options and updates remaining correct answers needed.
   */
  const checkAnswer = useCallback(() => {
    if (!selectedOptionsIndex || selectedOptionsIndex.length === 0) return;

    const timestamp = getTimestamp();
    setHasChecked(true);

    setState((prev) => {
      // Separate selected options into correct and wrong
      const correctSelectedThisRound = selectedOptionsIndex.filter((option) =>
        correctAnswers.includes(option),
      );

      const wrongSelectedThisRound = selectedOptionsIndex.filter(
        (option) => !correctAnswers.includes(option),
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
        optionSelected: true,
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
                selected: selectedOptionsIndex,
                timestamp,
                partiallyCorrect: correctSelectedThisRound.length > 0, // Track if there were some correct answers
              },
            ]
          : prev.wrongAttempts,
        attemptsCount: prev.attemptsCount + 1,
      };
    });

    // Disable options that were not selected in this round
    const allOptions = Array.from({ length: 20 }, (_, i) => i); // Assuming max 20 options, adjust as needed
    const optionsToDisable = allOptions.filter((opt) => !selectedOptionsIndex.includes(opt));
    setDisabledOptionsIndex(optionsToDisable);

    // Update remaining correct answers to select
    setRemainingCorrectToSelect((prev) => {
      const correctSelected = selectedOptionsIndex.filter((opt) =>
        correctAnswers.includes(opt),
      ).length;
      return Math.max(0, prev - correctSelected);
    });

    // Clear selections for next round
    setSelectedOptionsIndex(null);
    setHasChecked(false);
  }, [selectedOptionsIndex, correctAnswers]);

  /**
   * Resets correctness flag for another try and clears disabled options.
   */
  const tryAgain = useCallback(() => {
    setHasChecked(false);
    setDisabledOptionsIndex(null);
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
      optionSelected: true,
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
    setSelectedOptionsIndex(null);
    setDisabledOptionsIndex(null);
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
    selectedOptionsIndex,
    disabledOptionsIndex,
    remainingCorrectToSelect,
    canSelectMore,
    selectOptions,
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

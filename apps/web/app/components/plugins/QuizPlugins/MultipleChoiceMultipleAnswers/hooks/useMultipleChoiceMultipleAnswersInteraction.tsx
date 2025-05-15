import { useCallback, useState } from 'react';
import type { z } from 'zod';

import { MultipleChoiceMultipleAnswersInteractionSchema } from '@gonasi/schemas/plugins';

const schema = MultipleChoiceMultipleAnswersInteractionSchema;

type InteractionState = z.infer<typeof schema>;

const getTimestamp = () => Date.now();

/**
 * Custom hook to manage a multiple choice multiple answers quiz interaction state.
 */
export function useMultipleChoiceMultipleAnswersInteraction(initial?: Partial<InteractionState>) {
  const [state, setState] = useState<InteractionState>(() =>
    schema.parse({
      ...initial,
      interactionType: 'multiple_choice_multiple',
    }),
  );

  const [selectedOptionsIndex, setSelectedOptionsIndex] = useState<number[] | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  /**
   * Handles user toggling of one or more options by index.
   * If the answer has already been checked, selection is disabled.
   */
  const selectOptions = useCallback(
    (selections: number | number[]) => {
      if (hasChecked) return;

      const selectionArray = Array.isArray(selections) ? selections : [selections];

      setSelectedOptionsIndex((prev) => {
        const prevSet = new Set(prev ?? []);
        for (const index of selectionArray) {
          if (prevSet.has(index)) {
            prevSet.delete(index);
          } else {
            prevSet.add(index);
          }
        }

        const updated = Array.from(prevSet).sort((a, b) => a - b);
        return updated.length === 0 ? null : updated;
      });
    },
    [hasChecked],
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
   */
  const checkAnswer = useCallback(
    (correctAnswerIndexes: number[]) => {
      if (selectedOptionsIndex === null) return;

      const timestamp = getTimestamp();

      setHasChecked(true);

      setState((prev) => {
        // Separate selected options into correct and wrong
        const correctSelectedThisRound = selectedOptionsIndex.filter((option) =>
          correctAnswerIndexes.includes(option),
        );

        const wrongSelectedThisRound = selectedOptionsIndex.filter(
          (option) => !correctAnswerIndexes.includes(option),
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
          correctAnswerIndexes.slice().sort(),
        );

        // Determine if this specific selection contains any wrong answers
        const hasWrongAnswers = wrongSelectedThisRound.length > 0;

        return {
          ...prev,
          optionSelected: true,
          isCorrect: isFullyCorrect && !hasWrongAnswers, // Only mark as correct if no wrong answers in current selection
          continue: isFullyCorrect,
          canShowContinueButton: isFullyCorrect,
          canShowCorrectAnswer: true,
          canShowExplanationButton: isFullyCorrect || hasWrongAnswers, // Show explanation for wrong answers too
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

      setSelectedOptionsIndex(null);
    },
    [selectedOptionsIndex],
  );
  /**
   * Resets correctness flag for another try.
   */
  const tryAgain = useCallback(() => {
    setHasChecked(false);
    setState((prev) => ({
      ...prev,
      isCorrect: null,
    }));
  }, []);

  /**
   * Marks correct answer as revealed.
   */
  const revealCorrectAnswer = useCallback((correctAnswerIndexes: number[]) => {
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
      correctAttempt: { selected: correctAnswerIndexes, timestamp },
    }));
  }, []);

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
    setHasChecked(false);
  }, []);

  return {
    state,
    selectedOptionsIndex,
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

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
  // Main interaction state (parsed with schema)
  const [state, setState] = useState<InteractionState>(() =>
    schema.parse({
      ...initial,
      interactionType: 'multiple_choice_multiple_answers',
    }),
  );

  // The array of option indexes currently selected by the user
  const [selectedOptionIndexes, setSelectedOptionIndexes] = useState<number[]>(
    initial?.selectedOptions || [],
  );

  /**
   * Indicates whether the user has already checked their answer.
   * This is used to:
   * - Prevent multiple checks for the same selection.
   * - Disable option selection after checking.
   * - Control conditional UI logic (e.g., show correct answers or feedback).
   */
  const [hasChecked, setHasChecked] = useState(false);

  /**
   * Handles user selection of an option by index.
   * If the answer has already been checked, selection is disabled.
   * Selecting the same option again will unselect it (toggle behavior).
   */
  const toggleOption = useCallback(
    (selection: number) => {
      if (hasChecked) return;

      setSelectedOptionIndexes((prev) => {
        // If already selected, remove it
        if (prev.includes(selection)) {
          return prev.filter((index) => index !== selection);
        }
        // Otherwise add it
        return [...prev, selection];
      });
    },
    [hasChecked],
  );

  /**
   * Checks the user's answer against the correct answer indexes.
   * Updates the interaction state with correctness, attempts, and UI flags.
   * Sets `hasChecked` to true to lock further interaction until reset.
   */
  const checkAnswer = useCallback(
    (correctAnswerIndexes: number[], minRequired: number = 1) => {
      if (selectedOptionIndexes.length < minRequired) return;

      const timestamp = getTimestamp();

      // Check if selected answers match correct answers
      const allCorrectSelected = correctAnswerIndexes.every((index) =>
        selectedOptionIndexes.includes(index),
      );

      // Check if no incorrect answers were selected
      const noIncorrectSelected = selectedOptionIndexes.every((index) =>
        correctAnswerIndexes.includes(index),
      );

      // Only correct if all correct answers are selected AND no incorrect answers are selected
      const isCorrect = allCorrectSelected && noIncorrectSelected;

      setHasChecked(true);
      setState((prev) => {
        if (isCorrect) {
          return {
            ...prev,
            optionsSelected: true,
            isCorrect: true,
            continue: true,
            canShowContinueButton: true,
            canShowCorrectAnswers: true,
            canShowExplanationButton: true,
            correctAttempt: { selected: selectedOptionIndexes, timestamp },
            attemptsCount: prev.attemptsCount + 1,
            selectedOptions: selectedOptionIndexes,
          };
        } else {
          return {
            ...prev,
            optionsSelected: true,
            isCorrect: false,
            canShowCorrectAnswers: true,
            wrongAttempts: [...prev.wrongAttempts, { selected: selectedOptionIndexes, timestamp }],
            attemptsCount: prev.attemptsCount + 1,
            selectedOptions: selectedOptionIndexes,
          };
        }
      });
    },
    [selectedOptionIndexes],
  );

  /**
   * Allows the user to try again after an incorrect attempt.
   * Resets the correctness state while preserving attempt history.
   */
  const tryAgain = useCallback(() => {
    setHasChecked(false);
    setSelectedOptionIndexes([]);
    setState((prev) => ({
      ...prev,
      isCorrect: null,
      selectedOptions: [],
    }));
  }, []);

  /**
   * Marks the correct answers as revealed.
   * Useful for feedback after checking or skipping.
   */
  const revealCorrectAnswers = useCallback((correctAnswerIndexes: number[]) => {
    const timestamp = getTimestamp();

    setState((prev) => ({
      ...prev,
      correctAnswersRevealed: true,
      optionsSelected: true,
      isCorrect: true,
      continue: true,
      canShowContinueButton: true,
      canShowCorrectAnswers: true,
      canShowExplanationButton: true,
      correctAttempt: { selected: correctAnswerIndexes, timestamp },
      selectedOptions: correctAnswerIndexes,
    }));

    // Update the selected options to show the correct answers
    setSelectedOptionIndexes(correctAnswerIndexes);
  }, []);

  /**
   * Skips the current interaction.
   * Enables the user to move forward without answering.
   */
  const skip = useCallback(() => {
    setState((prev) => ({
      ...prev,
      continue: true,
      canShowContinueButton: true,
      canShowCorrectAnswers: true,
    }));
  }, []);

  /**
   * Resets the interaction to its initial state.
   * Clears the selected options and resets `hasChecked`.
   */
  const reset = useCallback(() => {
    setState(() =>
      schema.parse({
        interactionType: 'multiple_choice_multiple_answers',
      }),
    );
    setSelectedOptionIndexes([]);
    setHasChecked(false);
  }, []);

  return {
    state,
    selectedOptionIndexes,
    toggleOption,
    checkAnswer,
    revealCorrectAnswers,
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

import { useCallback, useState } from 'react';
import type { z } from 'zod';

import { MultipleChoiceSingleAnswerInteractionSchema } from '@gonasi/schemas/plugins';

const schema = MultipleChoiceSingleAnswerInteractionSchema;

type InteractionState = z.infer<typeof schema>;

const getTimestamp = () => Date.now();

/**
 * Custom hook to manage a multiple choice single answer quiz interaction state.
 */
export function useMultipleChoiceSingleAnswerInteraction(initial?: Partial<InteractionState>) {
  // Main interaction state (parsed with schema)
  const [state, setState] = useState<InteractionState>(() =>
    schema.parse({
      ...initial,
      interactionType: 'multiple_choice_single_answer',
    }),
  );

  // The option index currently selected by the user (number | null)
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);

  /**
   * Indicates whether the user has already checked their answer.
   * This is used to:
   * - Prevent multiple checks for the same selection.
   * - Disable option selection after checking.
   * - Control conditional UI logic (e.g., show correct answer or feedback).
   */
  const [hasChecked, setHasChecked] = useState(false);

  /**
   * Handles user selection of an option by index.
   * If the answer has already been checked, selection is disabled.
   * Selecting the same option again will unselect it (toggle behavior).
   */
  const selectOption = useCallback(
    (selection: number) => {
      if (hasChecked) return;

      setSelectedOptionIndex((prev) => (prev === selection ? null : selection));
    },
    [hasChecked],
  );

  /**
   * Checks the user's answer against the correct answer index.
   * Updates the interaction state with correctness, attempts, and UI flags.
   * Sets `hasChecked` to true to lock further interaction until reset.
   */
  const checkAnswer = useCallback(
    (correctAnswerIndex: number) => {
      if (selectedOptionIndex === null) return;

      const timestamp = getTimestamp();
      const isCorrect = selectedOptionIndex === correctAnswerIndex;

      setHasChecked(true);
      setState((prev) => {
        if (isCorrect) {
          return {
            ...prev,
            optionSelected: true,
            isCorrect: true,
            continue: true,
            canShowContinueButton: true,
            canShowCorrectAnswer: true,
            canShowExplanationButton: true,
            correctAttempt: { selected: selectedOptionIndex, timestamp },
            attemptsCount: prev.attemptsCount + 1,
          };
        } else {
          return {
            ...prev,
            optionSelected: true,
            isCorrect: false,
            canShowCorrectAnswer: true,
            wrongAttempts: [...prev.wrongAttempts, { selected: selectedOptionIndex, timestamp }],
            attemptsCount: prev.attemptsCount + 1,
          };
        }
      });
      setSelectedOptionIndex(null);
    },
    [selectedOptionIndex],
  );

  /**
   * Allows the user to try again after an incorrect attempt.
   * Resets the correctness state while preserving attempt history.
   */
  const tryAgain = useCallback(() => {
    setHasChecked(false);
    setState((prev) => ({
      ...prev,
      isCorrect: null,
    }));
  }, []);

  /**
   * Marks the correct answer as revealed.
   * Useful for feedback after checking or skipping.
   */
  const revealCorrectAnswer = useCallback((correctAnswerIndex: number) => {
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
      correctAttempt: { selected: correctAnswerIndex, timestamp },
    }));
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
      canShowCorrectAnswer: true,
    }));
  }, []);

  /**
   * Resets the interaction to its initial state.
   * Clears the selected option and resets `hasChecked`.
   */
  const reset = useCallback(() => {
    setState(() =>
      schema.parse({
        interactionType: 'multiple_choice_single_answer',
      }),
    );
    setSelectedOptionIndex(null);
    setHasChecked(false);
  }, []);

  return {
    state,
    selectedOptionIndex,
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
export type MultipleChoiceSingleAnswerInteractionReturn = ReturnType<
  typeof useMultipleChoiceSingleAnswerInteraction
>;

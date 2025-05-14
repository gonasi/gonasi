import { useCallback, useState } from 'react';
import type { z } from 'zod';

import { TrueOrFalseInteractionSchema } from '@gonasi/schemas/plugins';

const schema = TrueOrFalseInteractionSchema;

type InteractionState = z.infer<typeof schema>;

const getTimestamp = () => Date.now();

/**
 * Custom hook to manage a true/false quiz interaction state.
 */
export function useTrueOrFalseInteraction(initial?: Partial<InteractionState>) {
  // Main interaction state (parsed with schema)
  const [state, setState] = useState<InteractionState>(() =>
    schema.parse({
      ...initial,
      interactionType: 'true_false',
    }),
  );

  // The option currently selected by the user (true/false/null)
  const [selectedOption, setSelectedOption] = useState<boolean | null>(null);

  /**
   * Indicates whether the user has already checked their answer.
   * This is used to:
   * - Prevent multiple checks for the same selection.
   * - Disable option selection after checking.
   * - Control conditional UI logic (e.g., show correct answer or feedback).
   */
  const [hasChecked, setHasChecked] = useState(false);

  /**
   * Handles user selection of true/false.
   * If the answer has already been checked, selection is disabled.
   * Selecting the same option again will unselect it (toggle behavior).
   */
  const selectOption = useCallback(
    (selection: boolean) => {
      if (hasChecked) return;

      setSelectedOption((prev) => (prev === selection ? null : selection));
    },
    [hasChecked],
  );

  /**
   * Checks the user's answer against the correct answer.
   * Updates the interaction state with correctness, attempts, and UI flags.
   * Sets `hasChecked` to true to lock further interaction until reset.
   */
  const checkAnswer = useCallback(
    (correctAnswer: boolean) => {
      if (selectedOption === null) return;

      const timestamp = getTimestamp();
      const isCorrect = selectedOption === correctAnswer;

      setSelectedOption(null);
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
            correctAttempt: { selected: selectedOption, timestamp },
            attemptsCount: prev.attemptsCount + 1,
          };
        } else {
          return {
            ...prev,
            optionSelected: true,
            isCorrect: false,
            canShowCorrectAnswer: true,
            wrongAttempts: [...prev.wrongAttempts, { selected: selectedOption, timestamp }],
            attemptsCount: prev.attemptsCount + 1,
          };
        }
      });
    },
    [selectedOption],
  );

  const tryAgain = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isCorrect: null,
    }));
  }, []);

  /**
   * Marks the correct answer as revealed.
   * Useful for feedback after checking or skipping.
   */
  const revealCorrectAnswer = useCallback((correctAnswer: boolean) => {
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
      correctAttempt: { selected: correctAnswer, timestamp },
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
        interactionType: 'true_false',
      }),
    );
    setSelectedOption(null);
    setHasChecked(false);
  }, []);

  return {
    state,
    selectedOption,
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
export type TrueOrFalseInteractionReturn = ReturnType<typeof useTrueOrFalseInteraction>;

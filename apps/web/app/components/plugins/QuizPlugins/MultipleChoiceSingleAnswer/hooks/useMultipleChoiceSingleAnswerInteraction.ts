import { useCallback, useMemo, useState } from 'react';

import {
  MultipleChoiceSingleAnswerInteractionSchema,
  type MultipleChoiceSingleAnswerInteractionSchemaType,
} from '@gonasi/schemas/plugins';

import { calculateMultipleChoiceSingleAnswerScore } from '../utils';

const schema = MultipleChoiceSingleAnswerInteractionSchema;

// Returns the current timestamp (used for tracking interaction times)
const getTimestamp = () => Date.now();

/**
 * Custom React hook to manage the state and logic for a "Multiple Choice Single Answer" quiz interaction.
 *
 * @param initial - The initial state for the interaction (can be null)
 * @param correctAnswerUuid - The UUID of the correct answer option
 */
export function useMultipleChoiceSingleAnswerInteraction(
  initial: MultipleChoiceSingleAnswerInteractionSchemaType | null,
  correctAnswerUuid: string,
  choiceCount: number,
) {
  // Fallback state used if `initial` is null
  const defaultState: MultipleChoiceSingleAnswerInteractionSchemaType = schema.parse({});

  // Main interaction state validated by schema (parsed from initial or fallback)
  const [state, setState] = useState<MultipleChoiceSingleAnswerInteractionSchemaType>(() =>
    schema.parse(initial ?? defaultState),
  );

  // Tracks which option UUID the user has selected; null means no selection
  const [selectedOptionUuid, setSelectedOptionUuid] = useState<string | null>(null);

  // Derived state - compute these from the main state instead of maintaining separate state
  const isCompleted = useMemo(() => {
    return state.correctAttempt !== null || state.hasRevealedCorrectAnswer;
  }, [state.correctAttempt, state.hasRevealedCorrectAnswer]);

  const canInteract = useMemo(() => {
    return !isCompleted && state.showCheckIfAnswerIsCorrectButton;
  }, [isCompleted, state.showCheckIfAnswerIsCorrectButton]);

  // Count of actual attempts (excludes revealed answers)
  // User can make at most 2 attempts: 1 wrong + 1 correct, or just 1 correct
  const attemptsCount = useMemo(() => {
    let count = 0;

    // Count wrong attempts (max 1 in this flow)
    if (state.wrongAttempts.length > 0) {
      count += 1;
    }

    // Only count correct attempt if it wasn't revealed
    if (state.correctAttempt !== null && !state.hasRevealedCorrectAnswer) {
      count += 1;
    }

    return count;
  }, [state.wrongAttempts.length, state.correctAttempt, state.hasRevealedCorrectAnswer]);

  // Calculate the actual score
  const score = useMemo(() => {
    return calculateMultipleChoiceSingleAnswerScore({
      correctAnswerRevealed: state.hasRevealedCorrectAnswer,
      wrongAttemptsCount: state.wrongAttempts.length,
      numberOfOptions: choiceCount,
    });
  }, [choiceCount, state.hasRevealedCorrectAnswer, state.wrongAttempts.length]);

  /**
   * Allows the user to select or toggle an option by UUID.
   * Selection is disabled if the interaction is completed.
   * Clicking the selected option again will deselect it.
   */
  const selectOption = useCallback(
    (selection: string) => {
      if (!canInteract) return;
      setSelectedOptionUuid((prev) => (prev === selection ? null : selection));
    },
    [canInteract],
  );

  /**
   * Validates the selected answer against the correct one.
   * Updates the interaction state accordingly, storing timestamps and correctness.
   */
  const checkAnswer = useCallback(() => {
    if (selectedOptionUuid === null || !canInteract) return;

    const timestamp = getTimestamp();
    const isCorrect = selectedOptionUuid === correctAnswerUuid;

    // Capture the selected value before any state updates
    const selectedValue = selectedOptionUuid;

    setState((prev) => {
      const newState = {
        ...prev,
        showCheckIfAnswerIsCorrectButton: false,
        showTryAgainButton: false,
        showShowAnswerButton: false,
        showContinueButton: false,
        canShowExplanationButton: false,
        hasRevealedCorrectAnswer: false,
      };

      if (isCorrect) {
        // Correct answer: enable continue and explanation
        return {
          ...newState,
          showContinueButton: true,
          canShowExplanationButton: true,
          correctAttempt: { selected: selectedValue, timestamp },
        };
      } else {
        // Wrong answer: allow retry, show correct answer option, record wrong attempt
        return {
          ...newState,
          showTryAgainButton: true,
          showShowAnswerButton: true,
          wrongAttempts: [...prev.wrongAttempts, { selected: selectedValue, timestamp }],
        };
      }
    });

    // Clear selection after processing
    setSelectedOptionUuid(null);
  }, [correctAnswerUuid, selectedOptionUuid, canInteract]);

  /**
   * Allows the user to retry the interaction after a wrong attempt.
   * Resets the UI state and enables selection again.
   */
  const tryAgain = useCallback(() => {
    // Only allow retry if not completed and currently in wrong answer state
    if (isCompleted || !state.showTryAgainButton) return;

    setState((prev) => ({
      ...prev,
      showCheckIfAnswerIsCorrectButton: true,
      showTryAgainButton: false,
      showShowAnswerButton: true, // Keep show answer available
      showContinueButton: false,
      canShowExplanationButton: false,
      hasRevealedCorrectAnswer: false,
    }));

    setSelectedOptionUuid(null);
  }, [isCompleted, state.showTryAgainButton]);

  /**
   * Programmatically reveals the correct answer.
   * Updates state to reflect the correct answer and enables appropriate UI flags.
   * This action completes the interaction permanently.
   */
  const revealCorrectAnswer = useCallback(() => {
    if (isCompleted) return;

    const timestamp = getTimestamp();

    setState((prev) => ({
      ...prev,
      showCheckIfAnswerIsCorrectButton: false,
      showTryAgainButton: false,
      showShowAnswerButton: false,
      showContinueButton: true,
      canShowExplanationButton: true,
      hasRevealedCorrectAnswer: true,
      correctAttempt: { selected: correctAnswerUuid, timestamp },
    }));

    setSelectedOptionUuid(null);
  }, [correctAnswerUuid, isCompleted]);

  /**
   * Reset the entire interaction to its initial state.
   * Useful for allowing users to restart the quiz.
   */
  const reset = useCallback(() => {
    setState(defaultState);
    setSelectedOptionUuid(null);
  }, [defaultState]);

  return {
    // State
    state,
    selectedOptionUuid,

    // Derived state
    isCompleted,
    canInteract,
    attemptsCount,
    score,

    // Actions
    selectOption,
    checkAnswer,
    revealCorrectAnswer,
    tryAgain,
    reset,
  };
}

// Exported type for external use (e.g., props or testing)
export type MultipleChoiceSingleAnswerInteractionReturn = ReturnType<
  typeof useMultipleChoiceSingleAnswerInteraction
>;

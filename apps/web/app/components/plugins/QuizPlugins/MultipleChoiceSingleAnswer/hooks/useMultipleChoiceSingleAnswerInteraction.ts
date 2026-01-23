import { useCallback, useMemo, useState } from 'react';

import {
  type MultipleChoiceSingleAnswerContentSchemaTypes,
  MultipleChoiceSingleAnswerInteractionSchema,
  type MultipleChoiceSingleAnswerInteractionSchemaTypes,
} from '@gonasi/schemas/plugins';

import { calculateMultipleChoiceSingleAnswerScore } from '../utils';

const schema = MultipleChoiceSingleAnswerInteractionSchema;

// Returns the current timestamp (used for tracking interaction times)
const getTimestamp = () => Date.now();

export function useMultipleChoiceSingleAnswerInteraction(
  initial: MultipleChoiceSingleAnswerInteractionSchemaTypes | null,
  content: MultipleChoiceSingleAnswerContentSchemaTypes,
) {
  const choices = content.choices;
  const correctChoiceId = choices.find((choice) => choice.isCorrect)?.id ?? '';

  // Memoize defaultState to prevent creating new object on every render
  const defaultState: MultipleChoiceSingleAnswerInteractionSchemaTypes = useMemo(
    () =>
      schema.parse({
        plugin_type: 'multiple_choice_single',
      }),
    [],
  );

  // Main interaction state validated by schema (parsed from initial or fallback)
  const [state, setState] = useState<MultipleChoiceSingleAnswerInteractionSchemaTypes>(() =>
    schema.parse(initial ?? { plugin_type: 'multiple_choice_single' }),
  );

  // Tracks which option the user has selected; null means no selection
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Derived state - compute these from the main state instead of maintaining separate state
  const isCompleted = useMemo(() => {
    return state.correctAttempt !== null || state.hasRevealedCorrectAnswer;
  }, [state.correctAttempt, state.hasRevealedCorrectAnswer]);

  const canInteract = useMemo(() => {
    return !isCompleted && state.showCheckIfAnswerIsCorrectButton;
  }, [isCompleted, state.showCheckIfAnswerIsCorrectButton]);

  // Count of actual attempts (excludes revealed answers)
  const attemptsCount = useMemo(() => {
    const wrongs = state.wrongAttempts.length;
    const rights = state.correctAttempt && !state.correctAttempt.wasRevealed ? 1 : 0;
    return wrongs + rights;
  }, [state.wrongAttempts.length, state.correctAttempt]);

  // Calculate the actual score
  const score = useMemo(() => {
    return calculateMultipleChoiceSingleAnswerScore({
      correctAnswerRevealed: state.hasRevealedCorrectAnswer,
      wrongAttemptsCount: state.wrongAttempts.length,
      numberOfOptions: choices.length,
    });
  }, [choices.length, state.hasRevealedCorrectAnswer, state.wrongAttempts.length]);

  /**
   * Allows the user to select or toggle an option.
   * Selection is disabled if the interaction is completed.
   * Clicking the selected option again will deselect it.
   */
  const selectOption = useCallback(
    (selection: string) => {
      if (!canInteract) return;
      setSelectedOption((prev) => (prev === selection ? null : selection));
    },
    [canInteract],
  );

  /**
   * Validates the selected answer against the correct one.
   * Updates the interaction state accordingly, storing timestamps and correctness.
   */
  const checkAnswer = useCallback(() => {
    if (selectedOption === null || !canInteract) return;

    const timestamp = getTimestamp();
    const isCorrect = selectedOption === correctChoiceId;

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
          correctAttempt: {
            selected: selectedOption,
            timestamp,
            wasRevealed: false,
          },
        };
      } else {
        // Wrong answer: allow retry, show correct answer option, record wrong attempt
        return {
          ...newState,
          showTryAgainButton: true,
          showShowAnswerButton: true,
          wrongAttempts: [...prev.wrongAttempts, { selected: selectedOption, timestamp }],
        };
      }
    });

    // Clear selection after processing
    setSelectedOption(null);
  }, [correctChoiceId, selectedOption, canInteract]);

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

    setSelectedOption(null);
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
      correctAttempt: {
        selected: correctChoiceId,
        timestamp,
        wasRevealed: true,
      },
    }));

    setSelectedOption(null);
  }, [correctChoiceId, isCompleted]);

  /**
   * Reset the entire interaction to its initial state.
   * Useful for allowing users to restart the quiz.
   */
  const reset = useCallback(() => {
    setState(defaultState);
    setSelectedOption(null);
  }, [defaultState]);

  return {
    // State
    state,
    selectedOption,

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

import { useCallback, useMemo, useState } from 'react';

import {
  MultipleChoiceMultipleAnswersInteractionSchema,
  type MultipleChoiceMultipleAnswersInteractionSchemaType,
} from '@gonasi/schemas/plugins';

import { calculateMultipleChoiceMultipleAnswerScore } from '../utils';

const schema = MultipleChoiceMultipleAnswersInteractionSchema;

// Returns the current timestamp (used for tracking interaction times)
const getTimestamp = () => Date.now();

/**
 * Custom React hook to manage the state and logic for a "Multiple Choice Multiple Answers" quiz interaction.
 *
 * @param initial - The initial state for the interaction (can be null)
 * @param correctAnswerUuids - Array of UUIDs representing the correct answer options
 * @param choiceCount - Total number of available choices
 */
export function useMultipleChoiceMultipleAnswersInteraction(
  initial: MultipleChoiceMultipleAnswersInteractionSchemaType | null,
  correctAnswerUuids: string[],
  choiceCount: number,
) {
  // Fallback state used if `initial` is null
  const defaultState: MultipleChoiceMultipleAnswersInteractionSchemaType = schema.parse({
    interactionType: 'multiple_choice_multiple',
  });

  // Main interaction state validated by schema (parsed from initial or fallback)
  const [state, setState] = useState<MultipleChoiceMultipleAnswersInteractionSchemaType>(() =>
    schema.parse(initial ?? defaultState),
  );

  // Tracks which option UUIDs the user has selected; null means no selections
  const [selectedOptionsUuids, setSelectedOptionsUuids] = useState<string[] | null>(null);

  // Derived state - compute these from the main state instead of maintaining separate state
  const isCompleted = useMemo(() => {
    const allChoicesSelected = state.correctAttempt?.selected.length === correctAnswerUuids.length;
    return allChoicesSelected || state.hasRevealedCorrectAnswer;
  }, [
    correctAnswerUuids.length,
    state.correctAttempt?.selected.length,
    state.hasRevealedCorrectAnswer,
  ]);

  const canInteract = useMemo(() => {
    return !isCompleted && state.showCheckIfAnswerIsCorrectButton;
  }, [isCompleted, state.showCheckIfAnswerIsCorrectButton]);

  // Count of actual attempts (excludes revealed answers)
  const attemptsCount = useMemo(() => {
    let count = 0;

    if (state.wrongAttempts.length > 0) {
      count += state.wrongAttempts.length;
    }

    // Only count correct attempt if it wasn't revealed
    if (state.correctAttempt !== null && !state.hasRevealedCorrectAnswer) {
      count += 1;
    }

    return count;
  }, [state.wrongAttempts.length, state.correctAttempt, state.hasRevealedCorrectAnswer]);

  // Calculate remaining correct answers to select
  const remainingCorrectToSelect = useMemo(() => {
    const alreadyFoundCorrect = state.correctAttempt?.selected?.length || 0;
    return Math.max(0, correctAnswerUuids.length - alreadyFoundCorrect);
  }, [correctAnswerUuids.length, state.correctAttempt?.selected?.length]);

  // Check if user can select more options
  const canSelectMore = useMemo(() => {
    if (!selectedOptionsUuids) return true;
    return selectedOptionsUuids.length < remainingCorrectToSelect;
  }, [selectedOptionsUuids, remainingCorrectToSelect]);

  // Calculate the actual score
  const score = useMemo(() => {
    return calculateMultipleChoiceMultipleAnswerScore({
      correctAnswersRevealed: state.hasRevealedCorrectAnswer,
      wrongAttemptsCount: state.wrongAttempts.length,
      totalChoices: choiceCount,
      totalCorrectAnswers: correctAnswerUuids.length,
    });
  }, [
    state.hasRevealedCorrectAnswer,
    state.wrongAttempts.length,
    choiceCount,
    correctAnswerUuids.length,
  ]);

  /**
   * Compares two arrays regardless of order for equality checking.
   */
  const areArraysEqual = useCallback((a: string[] | null, b: string[]) => {
    if (!a || a.length !== b.length) return false;
    const aSorted = [...a].sort();
    const bSorted = [...b].sort();
    return aSorted.every((val, idx) => val === bSorted[idx]);
  }, []);

  /**
   * Allows the user to select or toggle options by UUID.
   * Selection is disabled if the interaction is completed.
   * Limits selections to match the number of remaining correct answers.
   */
  const selectOption = useCallback(
    (uuid: string) => {
      if (!canInteract) return;

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
    [canInteract, remainingCorrectToSelect],
  );

  /**
   * Validates the selected answers against the correct ones.
   * Updates the interaction state accordingly, storing timestamps and correctness.
   */
  const checkAnswer = useCallback(() => {
    if (!selectedOptionsUuids || selectedOptionsUuids.length === 0 || !canInteract) return;

    const timestamp = getTimestamp();

    // Capture the selected values before any state updates
    const selectedValues = [...selectedOptionsUuids];

    setState((prev) => {
      // Separate selected options into correct and wrong
      const correctSelectedThisRound = selectedValues.filter((uuid) =>
        correctAnswerUuids.includes(uuid),
      );

      const wrongSelectedThisRound = selectedValues.filter(
        (uuid) => !correctAnswerUuids.includes(uuid),
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
        correctAnswerUuids.slice().sort(),
      );

      // Determine if this specific selection contains any wrong answers
      const hasWrongAnswers = wrongSelectedThisRound.length > 0;

      const newState = {
        ...prev,
        selectedOptions: selectedValues, // Update to match schema
        isCorrect: isFullyCorrect,
        continue: isFullyCorrect,
        showCheckIfAnswerIsCorrectButton: false,
        showTryAgainButton: false,
        showShowAnswerButton: false,
        showContinueButton: false,
        canShowExplanationButton: false,
        hasRevealedCorrectAnswer: false,
        correctAttempt: {
          selected: updatedCorrectSelected,
          timestamp: isFullyCorrect ? timestamp : (prev.correctAttempt?.timestamp ?? timestamp),
        },
      };

      if (isFullyCorrect) {
        // Fully correct: enable continue and explanation
        return {
          ...newState,
          showContinueButton: true,
          canShowExplanationButton: true,
        };
      } else {
        // Not fully correct: allow retry, show correct answer option, record wrong attempt
        const newWrongAttempts = hasWrongAnswers
          ? [
              ...prev.wrongAttempts,
              {
                selected: selectedValues,
                timestamp,
                partiallyCorrect: correctSelectedThisRound.length > 0,
              },
            ]
          : prev.wrongAttempts;

        return {
          ...newState,
          showTryAgainButton: true,
          showShowAnswerButton: true,
          wrongAttempts: newWrongAttempts,
        };
      }
    });

    // Clear selections after processing
    setSelectedOptionsUuids(null);
  }, [correctAnswerUuids, selectedOptionsUuids, canInteract, areArraysEqual]);

  /**
   * Allows the user to retry the interaction after a wrong attempt.
   * Resets the UI state and enables selection again.
   */
  const tryAgain = useCallback(() => {
    // Only allow retry if not completed and currently in wrong answer state
    if (isCompleted || !state.showTryAgainButton) return;

    setState((prev) => ({
      ...prev,
      isCorrect: null,
      showCheckIfAnswerIsCorrectButton: true,
      showTryAgainButton: false,
      showShowAnswerButton: true, // Keep show answer available
      showContinueButton: false,
      canShowExplanationButton: false,
      hasRevealedCorrectAnswer: false,
    }));

    setSelectedOptionsUuids(null);
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
      selectedOptions: correctAnswerUuids, // Update to match schema
      isCorrect: true,
      continue: true,
      showCheckIfAnswerIsCorrectButton: false,
      showTryAgainButton: false,
      showShowAnswerButton: false,
      showContinueButton: true,
      canShowExplanationButton: true,
      hasRevealedCorrectAnswer: true,
      correctAttempt: { selected: correctAnswerUuids, timestamp },
    }));

    setSelectedOptionsUuids(null);
  }, [correctAnswerUuids, isCompleted]);

  /**
   * Reset the entire interaction to its initial state.
   * Useful for allowing users to restart the quiz.
   */
  const reset = useCallback(() => {
    setState(defaultState);
    setSelectedOptionsUuids(null);
  }, [defaultState]);

  return {
    // State
    state,
    selectedOptionsUuids,

    // Derived state
    isCompleted,
    canInteract,
    attemptsCount,
    score,
    remainingCorrectToSelect,
    canSelectMore,

    // Actions
    selectOption,
    checkAnswer,
    revealCorrectAnswer,
    tryAgain,
    reset,
  };
}

// Exported type for external use (e.g., props or testing)
export type MultipleChoiceMultipleAnswersInteractionReturn = ReturnType<
  typeof useMultipleChoiceMultipleAnswersInteraction
>;

import { useCallback, useMemo, useState } from 'react';

import {
  type MultipleChoiceMultipleAnswersContentSchemaTypes,
  MultipleChoiceMultipleAnswersInteractionSchema,
  type MultipleChoiceMultipleAnswersInteractionSchemaTypes,
} from '@gonasi/schemas/plugins';

import { calculateMultipleChoiceMultipleAnswersScore } from '../utils';

const schema = MultipleChoiceMultipleAnswersInteractionSchema;

// Returns the current timestamp (used for tracking interaction times)
const getTimestamp = () => Date.now();

/**
 * Custom React hook to manage the state and logic for a "Multiple Choice Multiple Answers" quiz interaction.
 *
 * @param initial - The initial state for the interaction (can be null)
 * @param content - The content object containing choices and other quiz data
 */
export function useMultipleChoiceMultipleAnswersInteraction(
  initial: MultipleChoiceMultipleAnswersInteractionSchemaTypes | null,
  content: MultipleChoiceMultipleAnswersContentSchemaTypes,
) {
  // Extract correct answer IDs and choice count from content
  const correctAnswerIds = content.choices
    .filter((choice) => choice.isCorrect)
    .map((choice) => choice.id);
  const choiceCount = content.choices.length;
  // Memoize defaultState to prevent creating new object on every render
  const defaultState: MultipleChoiceMultipleAnswersInteractionSchemaTypes = useMemo(
    () =>
      schema.parse({
        plugin_type: 'multiple_choice_multiple',
      }),
    [],
  );

  // Main interaction state validated by schema (parsed from initial or fallback)
  const [state, setState] = useState<MultipleChoiceMultipleAnswersInteractionSchemaTypes>(() =>
    schema.parse(initial ?? { plugin_type: 'multiple_choice_multiple' }),
  );

  // Tracks which option IDs the user has selected; null means no selections
  const [selectedOptionsUuids, setSelectedOptionsUuids] = useState<string[] | null>(null);

  // Derived state - compute these from the main state instead of maintaining separate state
  const isCompleted = useMemo(() => {
    const allChoicesSelected = state.correctAttempt?.selected.length === correctAnswerIds.length;
    return allChoicesSelected || state.hasRevealedCorrectAnswer;
  }, [
    correctAnswerIds.length,
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
    if (
      state.correctAttempt?.selected.length === correctAnswerIds.length &&
      !state.hasRevealedCorrectAnswer
    ) {
      count += 1;
    }

    return count;
  }, [
    state.wrongAttempts.length,
    state.correctAttempt?.selected.length,
    state.hasRevealedCorrectAnswer,
    correctAnswerIds.length,
  ]);

  // Calculate remaining correct answers to select
  const remainingCorrectToSelect = useMemo(() => {
    const alreadyFoundCorrect = state.correctAttempt?.selected?.length || 0;
    return Math.max(0, correctAnswerIds.length - alreadyFoundCorrect);
  }, [correctAnswerIds.length, state.correctAttempt?.selected?.length]);

  // Check if user can select more options
  const canSelectMore = useMemo(() => {
    if (!selectedOptionsUuids) return true;
    return selectedOptionsUuids.length < remainingCorrectToSelect;
  }, [selectedOptionsUuids, remainingCorrectToSelect]);

  // Calculate the actual score
  const score = useMemo(() => {
    return calculateMultipleChoiceMultipleAnswersScore({
      // Core correctness indicators
      isCorrect: state.isCorrect,
      correctAnswersRevealed: state.hasRevealedCorrectAnswer,

      // Answer analysis
      correctAnswersSelected: state.correctAttempt?.selected.length ?? 0,
      totalCorrectAnswers: correctAnswerIds.length,
      wrongAnswersSelected: state.wrongAttempts.length,
      totalChoicesAvailable: choiceCount,

      // Attempt tracking
      attemptsCount,
      wrongAttempts: state.wrongAttempts,
    });
  }, [state, correctAnswerIds.length, choiceCount, attemptsCount]);

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
   * Allows the user to select or toggle options by ID.
   * Selection is disabled if the interaction is completed.
   * Limits selections to match the number of remaining correct answers.
   */
  const selectOption = useCallback(
    (id: string) => {
      if (!canInteract) return;

      setSelectedOptionsUuids((prev) => {
        const prevSet = new Set(prev ?? []);

        // If already selected, remove it
        if (prevSet.has(id)) {
          prevSet.delete(id);
        }
        // Only add if we haven't reached the limit
        else if (prevSet.size < remainingCorrectToSelect) {
          prevSet.add(id);
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
      const correctSelectedThisRound = selectedValues.filter((id) => correctAnswerIds.includes(id));

      const wrongSelectedThisRound = selectedValues.filter((id) => !correctAnswerIds.includes(id));

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
        correctAnswerIds.slice().sort(),
      );

      // Determine if this specific selection contains any wrong answers
      const hasWrongAnswers = wrongSelectedThisRound.length > 0;

      const newState = {
        ...prev,
        isCorrect: isFullyCorrect,
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
  }, [correctAnswerIds, selectedOptionsUuids, canInteract, areArraysEqual]);

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
      isCorrect: true,
      showCheckIfAnswerIsCorrectButton: false,
      showTryAgainButton: false,
      showShowAnswerButton: false,
      showContinueButton: true,
      canShowExplanationButton: true,
      hasRevealedCorrectAnswer: true,
      correctAttempt: { selected: correctAnswerIds, timestamp },
    }));

    setSelectedOptionsUuids(null);
  }, [correctAnswerIds, isCompleted]);

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

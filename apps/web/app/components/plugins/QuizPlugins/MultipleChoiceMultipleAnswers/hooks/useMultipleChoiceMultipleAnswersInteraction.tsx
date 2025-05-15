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

  // New tracking state for scoring parameters
  const [scoringParams, setScoringParams] = useState({
    correctSelectionsCount: 0, // Number of correct options selected so far
    totalCorrectAnswers: 0, // Total number of correct options required
    wrongSelectionsCount: 0, // Total number of wrong selections made
    totalAvailableOptions: 0, // Total number of available options (correct + incorrect)
  });

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
    (correctAnswerIndexes: number[], totalOptions?: number) => {
      if (selectedOptionsIndex === null) return;

      const timestamp = getTimestamp();

      setHasChecked(true);

      // Update scoring parameters with correct answers and total options information
      setScoringParams((prev) => ({
        ...prev,
        totalCorrectAnswers: correctAnswerIndexes.length,
        totalAvailableOptions: totalOptions || prev.totalAvailableOptions,
      }));

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

        // Check if this was a "select all" attempt (selecting most or all options)
        const selectAllAttempt = totalOptions
          ? selectedOptionsIndex.length > totalOptions * 0.7
          : false;

        // Update scoring params
        setScoringParams((prevParams) => ({
          ...prevParams,
          correctSelectionsCount: updatedCorrectSelected.length,
          wrongSelectionsCount: prevParams.wrongSelectionsCount + wrongSelectedThisRound.length,
        }));

        // Determine final correctness and continuation state
        const finalIsCorrect = isFullyCorrect && !hasWrongAnswers;

        // Important: continue should only be true if the answer is correct
        // This ensures we never have continue=true with isCorrect=false
        const shouldContinue = finalIsCorrect;

        return {
          ...prev,
          optionSelected: true,
          isCorrect: finalIsCorrect,
          continue: shouldContinue,
          canShowContinueButton: shouldContinue,
          canShowCorrectAnswer: !finalIsCorrect, // Only show "Show Answer" when incorrect
          canShowExplanationButton: true, // Always allow explanation
          correctAttempt: {
            selected: updatedCorrectSelected,
            timestamp: finalIsCorrect ? timestamp : (prev.correctAttempt?.timestamp ?? timestamp),
          },
          // Always track wrong attempts if any wrong options were selected
          wrongAttempts: hasWrongAnswers
            ? [
                ...prev.wrongAttempts,
                {
                  selected: selectedOptionsIndex,
                  timestamp,
                  partiallyCorrect: correctSelectedThisRound.length > 0, // Track if there were some correct answers
                  selectAllAttempt, // Flag if this was a "select all" attempt
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
      continue: false, // Ensure continue is false when trying again
      canShowContinueButton: false, // Hide continue button when trying again
    }));
  }, []);

  /**
   * Marks correct answer as revealed.
   */
  const revealCorrectAnswer = useCallback(
    (correctAnswerIndexes: number[], totalOptions?: number) => {
      const timestamp = getTimestamp();

      // Update scoring params for revealed answers
      setScoringParams((prev) => ({
        ...prev,
        correctSelectionsCount: correctAnswerIndexes.length,
        totalCorrectAnswers: correctAnswerIndexes.length,
        totalAvailableOptions: totalOptions || prev.totalAvailableOptions,
      }));

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
    },
    [],
  );

  /**
   * Skips current interaction without answering.
   */
  const skip = useCallback(() => {
    setState((prev) => ({
      ...prev,
      continue: true,
      canShowContinueButton: true,
      canShowCorrectAnswer: false, // Don't show "Show Answer" when skipping
      isCorrect: null, // Set to null instead of keeping previous value
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

    // Reset scoring params
    setScoringParams({
      correctSelectionsCount: 0,
      totalCorrectAnswers: 0,
      wrongSelectionsCount: 0,
      totalAvailableOptions: 0,
    });
  }, []);

  /**
   * Calculates the current score based on performance.
   */
  const calculateScore = useCallback(
    (totalOptions?: number) => {
      // If correct answers were revealed, score is 0
      if (state.correctAnswerRevealed) return 0;

      const wrongAttemptsCount = state.wrongAttempts.length;

      // Check if user is using a "select all" strategy
      const isSelectAllStrategy =
        totalOptions !== undefined &&
        state.wrongAttempts.some((attempt) => {
          // If an attempt selected more than 70% of all available options, consider it "select all" strategy
          return attempt.selected.length > totalOptions * 0.7;
        });

      // Apply significant penalty for "select all" strategy
      if (isSelectAllStrategy) {
        // If they've been using "select all" strategy, cap score at 40%
        const maxPossibleScore = 40;

        // Calculate a reduced score based on correct/total ratio
        const ratio =
          scoringParams.correctSelectionsCount / Math.max(scoringParams.totalCorrectAnswers, 1);
        return Math.round(Math.min(ratio * maxPossibleScore, maxPossibleScore));
      }

      // If all correct answers are selected, calculate score based on wrong attempts
      if (state.isCorrect) {
        // Score based on number of wrong attempts
        switch (wrongAttemptsCount) {
          case 0:
            return 100; // No wrong attempts = full score
          case 1:
            return 75; // One wrong attempt = 75% score
          case 2:
            return 50; // Two wrong attempts = 50% score
          default:
            return 25; // Three or more wrong attempts = 25% score
        }
      } else {
        // Calculate partial score even if not fully correct yet

        // Base percentage of correct answers selected (out of total required)
        const correctAnswerPercentage =
          Math.min(
            scoringParams.correctSelectionsCount / Math.max(scoringParams.totalCorrectAnswers, 1),
            1,
          ) * 100;

        // Calculate the precision of selections
        // Higher penalty when making many wrong selections relative to correct ones
        const precision =
          scoringParams.correctSelectionsCount /
          Math.max(scoringParams.correctSelectionsCount + scoringParams.wrongSelectionsCount, 1);

        // Apply a weighted penalty based on precision
        // Low precision = higher penalty (up to 80% reduction)
        const precisionPenalty = (1 - precision) * 80;

        // Apply the penalty
        let partialScore = Math.max(correctAnswerPercentage - precisionPenalty, 0);

        // Cap partial score at 90% if not fully correct
        partialScore = Math.min(partialScore, 90);

        return Math.round(partialScore);
      }
    },
    [state.correctAnswerRevealed, state.isCorrect, state.wrongAttempts, scoringParams],
  );

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
    scoringParams,
    calculateScore,
  };
}

// Inferred return type alias
export type MultipleChoiceMultipleAnswersInteractionReturn = ReturnType<
  typeof useMultipleChoiceMultipleAnswersInteraction
>;

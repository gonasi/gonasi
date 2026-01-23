import { useCallback, useMemo, useState } from 'react';

import {
  TrueOrFalseStateInteractionSchema,
  type TrueOrFalseStateInteractionSchemaTypes,
  type TrueOrFalseContentSchemaTypes,
} from '@gonasi/schemas/plugins';

import { calculateTrueFalseScore } from '../utils';

const schema = TrueOrFalseStateInteractionSchema;

const getTimestamp = () => Date.now();

export function useTrueOrFalseInteraction(
  initial: TrueOrFalseStateInteractionSchemaTypes | null,
  content: TrueOrFalseContentSchemaTypes,
) {
  const correctAnswer = content.correctAnswer;
  // Memoize defaultState to prevent creating new object on every render
  const defaultState: TrueOrFalseStateInteractionSchemaTypes = useMemo(
    () =>
      schema.parse({
        plugin_type: 'true_or_false',
      }),
    [],
  );

  const [state, setState] = useState<TrueOrFalseStateInteractionSchemaTypes>(() =>
    schema.parse(initial ?? { plugin_type: 'true_or_false' }),
  );

  const [selectedOption, setSelectedOption] = useState<boolean | null>(null);

  const isCompleted = useMemo(() => {
    return state.correctAttempt !== null || state.hasRevealedCorrectAnswer;
  }, [state.correctAttempt, state.hasRevealedCorrectAnswer]);

  const canInteract = useMemo(() => {
    return !isCompleted && state.showCheckIfAnswerIsCorrectButton;
  }, [isCompleted, state.showCheckIfAnswerIsCorrectButton]);

  const attemptsCount = useMemo(() => {
    const wrongs = state.wrongAttempts.length;
    const rights = state.correctAttempt && !state.correctAttempt.wasRevealed ? 1 : 0;
    return wrongs + rights;
  }, [state.wrongAttempts.length, state.correctAttempt]);

  const score = useMemo(() => {
    return calculateTrueFalseScore(state);
  }, [state]);

  const selectOption = useCallback(
    (selection: boolean) => {
      if (!canInteract) return;
      setSelectedOption((prev) => (prev === selection ? null : selection));
    },
    [canInteract],
  );

  const checkAnswer = useCallback(() => {
    if (selectedOption === null || !canInteract) return;

    const timestamp = getTimestamp();
    const isCorrect = selectedOption === (correctAnswer === 'true');

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
        return {
          ...newState,
          showTryAgainButton: true,
          showShowAnswerButton: true,
          wrongAttempts: [...prev.wrongAttempts, { selected: selectedOption, timestamp }],
        };
      }
    });

    setSelectedOption(null);
  }, [correctAnswer, selectedOption, canInteract]);

  const tryAgain = useCallback(() => {
    if (isCompleted || !state.showTryAgainButton) return;

    setState((prev) => ({
      ...prev,
      showCheckIfAnswerIsCorrectButton: true,
      showTryAgainButton: false,
      showShowAnswerButton: true,
      showContinueButton: false,
      canShowExplanationButton: false,
      hasRevealedCorrectAnswer: false,
    }));

    setSelectedOption(null);
  }, [isCompleted, state.showTryAgainButton]);

  const revealCorrectAnswer = useCallback(() => {
    if (isCompleted) return;

    const timestamp = getTimestamp();
    const correctAnswerBoolean = correctAnswer === 'true';

    setState((prev) => ({
      ...prev,
      showCheckIfAnswerIsCorrectButton: false,
      showTryAgainButton: false,
      showShowAnswerButton: false,
      showContinueButton: true,
      canShowExplanationButton: true,
      hasRevealedCorrectAnswer: true,
      correctAttempt: {
        selected: correctAnswerBoolean,
        timestamp,
        wasRevealed: true,
      },
    }));

    setSelectedOption(null);
  }, [correctAnswer, isCompleted]);

  const reset = useCallback(() => {
    setState(defaultState);
    setSelectedOption(null);
  }, [defaultState]);

  return {
    // State
    state,
    selectedOption,

    // Derived
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

export type TrueOrFalseInteractionReturn = ReturnType<typeof useTrueOrFalseInteraction>;

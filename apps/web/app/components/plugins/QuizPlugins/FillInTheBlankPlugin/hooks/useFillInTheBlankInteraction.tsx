import { useCallback, useMemo, useState } from 'react';

import {
  FillInTheBlankStateInteractionSchema,
  type FillInTheBlankStateInteractionSchemaTypes,
} from '@gonasi/schemas/plugins';

import { calculateFillInTheBlankScore, getLetterFeedback, isAnswerCorrect } from '../utils';

const schema = FillInTheBlankStateInteractionSchema;

const getTimestamp = () => Date.now();

export function useFillInTheBlankInteraction(
  initial: FillInTheBlankStateInteractionSchemaTypes | null,
  correctAnswer: string,
  caseSensitive: boolean = false,
) {
  const defaultState: FillInTheBlankStateInteractionSchemaTypes = schema.parse({
    plugin_type: 'fill_in_the_blank',
  });

  const [state, setState] = useState<FillInTheBlankStateInteractionSchemaTypes>(() =>
    schema.parse(initial ?? { plugin_type: 'fill_in_the_blank' }),
  );

  const [userInput, setUserInput] = useState<string>('');

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
    return calculateFillInTheBlankScore(state);
  }, [state]);

  // Get letter-by-letter feedback for the current input
  const letterFeedback = useMemo(() => {
    if (!userInput) return [];
    return getLetterFeedback(userInput, correctAnswer, caseSensitive);
  }, [userInput, correctAnswer, caseSensitive]);

  const updateInput = useCallback(
    (value: string) => {
      if (!canInteract) return;
      setUserInput(value);
    },
    [canInteract],
  );

  const checkAnswer = useCallback(() => {
    if (!userInput.trim() || !canInteract) return;

    const timestamp = getTimestamp();
    const isCorrect = isAnswerCorrect(userInput, correctAnswer, caseSensitive);

    setState((prev) => {
      const newState = {
        ...prev,
        userAnswer: userInput,
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
            answer: userInput,
            timestamp,
            wasRevealed: false,
          },
        };
      } else {
        return {
          ...newState,
          showTryAgainButton: true,
          showShowAnswerButton: true,
          wrongAttempts: [...prev.wrongAttempts, { answer: userInput, timestamp }],
        };
      }
    });
  }, [correctAnswer, userInput, canInteract, caseSensitive]);

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

    setUserInput('');
  }, [isCompleted, state.showTryAgainButton]);

  const revealCorrectAnswer = useCallback(() => {
    if (isCompleted) return;

    const timestamp = getTimestamp();

    setState((prev) => ({
      ...prev,
      userAnswer: correctAnswer,
      showCheckIfAnswerIsCorrectButton: false,
      showTryAgainButton: false,
      showShowAnswerButton: false,
      showContinueButton: true,
      canShowExplanationButton: true,
      hasRevealedCorrectAnswer: true,
      correctAttempt: {
        answer: correctAnswer,
        timestamp,
        wasRevealed: true,
      },
    }));

    setUserInput(correctAnswer);
  }, [correctAnswer, isCompleted]);

  const reset = useCallback(() => {
    setState(defaultState);
    setUserInput('');
  }, [defaultState]);

  return {
    // State
    state,
    userInput,
    letterFeedback,

    // Derived
    isCompleted,
    canInteract,
    attemptsCount,
    score,

    // Actions
    updateInput,
    checkAnswer,
    revealCorrectAnswer,
    tryAgain,
    reset,
  };
}

export type FillInTheBlankInteractionReturn = ReturnType<typeof useFillInTheBlankInteraction>;

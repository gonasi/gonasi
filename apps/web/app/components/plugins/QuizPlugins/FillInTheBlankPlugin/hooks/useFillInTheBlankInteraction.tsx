import { useCallback, useMemo, useState } from 'react';

import {
  type FillInTheBlankContentSchemaTypes,
  FillInTheBlankStateInteractionSchema,
  type FillInTheBlankStateInteractionSchemaTypes,
} from '@gonasi/schemas/plugins';

import { calculateFillInTheBlankScore, getLetterFeedback, isAnswerCorrect } from '../utils';

const schema = FillInTheBlankStateInteractionSchema;

const getTimestamp = () => Date.now();

export function useFillInTheBlankInteraction(
  initial: FillInTheBlankStateInteractionSchemaTypes | null,
  content: FillInTheBlankContentSchemaTypes,
) {
  const correctAnswer = content.correctAnswer;
  const caseSensitive = content.caseSensitive || false;
  // Memoize defaultState to prevent creating new object on every render
  const defaultState: FillInTheBlankStateInteractionSchemaTypes = useMemo(
    () =>
      schema.parse({
        plugin_type: 'fill_in_the_blank',
      }),
    [],
  );

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

    // Build letter attempts array - track each letter attempt
    const userInputNoSpaces = userInput.replace(/\s/g, '');
    const correctAnswerNoSpaces = correctAnswer.replace(/\s/g, '');

    setState((prev) => {
      // Update letterAttempts array with current attempt
      const updatedLetterAttempts = [...prev.letterAttempts];

      // Ensure letterAttempts array is initialized for all positions
      while (updatedLetterAttempts.length < correctAnswerNoSpaces.length) {
        updatedLetterAttempts.push([]);
      }

      // Record each letter attempt
      for (let i = 0; i < userInputNoSpaces.length; i++) {
        const attemptedLetter = userInputNoSpaces[i];
        if (attemptedLetter && attemptedLetter.trim()) {
          // Only add if not already in the attempts for this position
          if (!updatedLetterAttempts[i].includes(attemptedLetter)) {
            updatedLetterAttempts[i] = [...updatedLetterAttempts[i], attemptedLetter];
          }
        }
      }

      const newState = {
        ...prev,
        userAnswer: userInput,
        letterAttempts: updatedLetterAttempts,
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
        const updatedWrongAttempts = [...prev.wrongAttempts, { answer: userInput, timestamp }];

        // Automatically reveal answer after 5 wrong attempts
        if (updatedWrongAttempts.length >= 5) {
          return {
            ...newState,
            userAnswer: correctAnswer,
            showContinueButton: true,
            canShowExplanationButton: true,
            hasRevealedCorrectAnswer: true,
            wrongAttempts: updatedWrongAttempts,
            correctAttempt: {
              answer: correctAnswer,
              timestamp,
              wasRevealed: true,
            },
          };
        }

        return {
          ...newState,
          showTryAgainButton: true,
          showShowAnswerButton: true,
          wrongAttempts: updatedWrongAttempts,
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
    letterAttempts: state.letterAttempts,

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

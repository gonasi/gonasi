import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, PartyPopper, X, XCircle } from 'lucide-react';

import type { BlockInteractionSchemaTypes, BuilderSchemaTypes } from '@gonasi/schemas/plugins';

import { useFillInTheBlankInteraction } from './hooks/useFillInTheBlankInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { RenderFeedback } from '../../common/RenderFeedback';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../PluginRenderers/ViewPluginTypesRenderer';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import {
  AnimateInButtonWrapper,
  BlockActionButton,
  CheckAnswerButton,
  OutlineButton,
  ShowAnswerButton,
  TryAgainButton,
} from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { useStore } from '~/store';

type FillInTheBlankPluginType = Extract<BuilderSchemaTypes, { plugin_type: 'fill_in_the_blank' }>;

type FillInTheBlankInteractionType = Extract<
  BlockInteractionSchemaTypes,
  { plugin_type: 'fill_in_the_blank' }
>;

function isFillInTheBlankInteraction(data: unknown): data is FillInTheBlankInteractionType {
  return (
    typeof data === 'object' &&
    data !== null &&
    'plugin_type' in data &&
    (data as any).plugin_type === 'fill_in_the_blank'
  );
}

export function ViewFillInTheBlankPlugin({ blockWithProgress }: ViewPluginComponentProps) {
  // Extract plugin configuration and content
  const {
    settings: { playbackMode, weight },
    content: { questionState, correctAnswer, explanationState, hint, caseSensitive },
  } = blockWithProgress.block as FillInTheBlankPluginType;

  const { is_last_block } = blockWithProgress;

  const { isExplanationBottomSheetOpen, setExplanationState, mode } = useStore();

  // Initialize core plugin functionality for tracking progress and submissions
  const {
    loading,
    payload,
    handleContinue,
    updateInteractionData,
    updateEarnedScore,
    updateAttemptsCount,
  } = useViewPluginCore(
    mode === 'play' ? { progress: blockWithProgress.block_progress, blockWithProgress } : null,
  );

  // Extract interaction data from database (when user returns to this block)
  const initialInteractionData: FillInTheBlankInteractionType | null = useMemo(() => {
    if (mode === 'preview') return null;

    const dbInteractionData = blockWithProgress.block_progress?.interaction_data;
    return isFillInTheBlankInteraction(dbInteractionData) ? dbInteractionData : null;
  }, [blockWithProgress.block_progress?.interaction_data, mode]);

  // Get current interaction data from payload (most recent in-memory state)
  const parsedPayloadData: FillInTheBlankInteractionType | null = useMemo(() => {
    const data = payload?.interaction_data;
    return isFillInTheBlankInteraction(data) ? data : null;
  }, [payload?.interaction_data]);

  // Use the most recent data (payload takes precedence over initial DB data)
  const currentInteractionData = parsedPayloadData || initialInteractionData;

  // Initialize interaction hook with saved state and answer validation
  const {
    state, // Full interaction state (attempts, UI flags, etc.)
    userInput, // Current user input string
    letterFeedback, // Per-letter feedback ('correct', 'incorrect', 'empty')
    letterAttempts, // History of attempts at each letter position
    updateInput, // Function to update user input
    checkAnswer, // Function to validate and record the current answer
    revealCorrectAnswer, // Function to show the correct answer
    isCompleted, // Whether the interaction is finished
    tryAgain, // Function to retry after wrong answer
    canInteract, // Whether user can currently interact with inputs
    score, // Calculated score based on attempts
    reset, // Function to reset the entire interaction
    attemptsCount, // Total number of attempts made
  } = useFillInTheBlankInteraction(currentInteractionData, correctAnswer, caseSensitive);

  // Determine if answer was revealed (not earned)
  const answerWasRevealed = state.hasRevealedCorrectAnswer || state.correctAttempt?.wasRevealed;

  // Create structure for letter boxes (including spaces)
  // This maps the correct answer to letter positions and space positions
  const answerStructure = useMemo(() => {
    const structure: { type: 'letter' | 'space'; index: number }[] = [];
    let letterIndex = 0;

    for (let i = 0; i < correctAnswer.length; i++) {
      if (correctAnswer[i] === ' ') {
        structure.push({ type: 'space', index: i });
      } else {
        structure.push({ type: 'letter', index: letterIndex });
        letterIndex++;
      }
    }
    return structure;
  }, [correctAnswer]);

  // Local UI state for managing individual letter boxes
  const [letters, setLetters] = useState<string[]>([]); // Current letter values in each box
  const [lockedLetters, setLockedLetters] = useState<Set<number>>(new Set()); // Letters locked from previous correct attempts
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]); // Refs to each input for focus management

  // Initialize letters array and restore from saved state when returning to this block
  useEffect(() => {
    const letterCount = answerStructure.filter((item) => item.type === 'letter').length;

    // If we have saved interaction data with a user answer, restore it
    if (currentInteractionData?.userAnswer) {
      const savedAnswer = currentInteractionData.userAnswer;
      const savedAnswerNoSpaces = savedAnswer.replace(/\s/g, '');
      const restoredLetters = savedAnswerNoSpaces
        .split('')
        .map((char) => char.toUpperCase())
        .slice(0, letterCount);

      // Pad with empty strings if needed
      while (restoredLetters.length < letterCount) {
        restoredLetters.push('');
      }

      setLetters(restoredLetters);
    } else {
      setLetters(new Array(letterCount).fill(''));
    }

    inputRefs.current = new Array(letterCount).fill(null);
  }, [answerStructure, currentInteractionData?.userAnswer]);

  // Restore locked letters from saved state when returning to a question
  // Locked letters are those that were guessed correctly in previous attempts
  useEffect(() => {
    if (currentInteractionData?.userAnswer && letters.length > 0) {
      const correctAnswerNoSpaces = correctAnswer.replace(/\s/g, '');
      const savedAnswerNoSpaces = currentInteractionData.userAnswer.replace(/\s/g, '');
      const newLockedLetters = new Set<number>();

      // Compare each saved letter with the correct answer to determine which should be locked
      for (let i = 0; i < savedAnswerNoSpaces.length; i++) {
        const expectedLetter = caseSensitive
          ? correctAnswerNoSpaces[i]
          : correctAnswerNoSpaces[i]?.toLowerCase();
        const userLetter = caseSensitive
          ? savedAnswerNoSpaces[i]
          : savedAnswerNoSpaces[i]?.toLowerCase();

        if (userLetter === expectedLetter) {
          newLockedLetters.add(i);
        }
      }

      setLockedLetters(newLockedLetters);
    }
  }, [currentInteractionData?.userAnswer, letters.length, correctAnswer, caseSensitive]);

  // Clear letters when state is reset (e.g., on refresh or reset button)
  useEffect(() => {
    if (!state.correctAttempt && state.wrongAttempts.length === 0) {
      const letterCount = answerStructure.filter((item) => item.type === 'letter').length;
      setLetters(new Array(letterCount).fill(''));
      setLockedLetters(new Set());
    }
  }, [state, answerStructure]);

  // Synchronize individual letter boxes with the full userInput string
  // Reconstructs the answer with spaces in their correct positions
  useEffect(() => {
    let reconstructed = '';
    let letterIndex = 0;

    for (let i = 0; i < correctAnswer.length; i++) {
      if (correctAnswer[i] === ' ') {
        reconstructed += ' ';
      } else {
        reconstructed += letters[letterIndex] || '';
        letterIndex++;
      }
    }

    updateInput(reconstructed.trim());
  }, [letters, correctAnswer, updateInput]);

  /**
   * Handle letter input changes
   * - Validates single character input
   * - Auto-advances to next unlocked box
   * - Converts input to uppercase for consistency
   */
  const handleLetterChange = (index: number, value: string) => {
    if (!canInteract || lockedLetters.has(index)) return;

    const newLetters = [...letters];

    // Only allow single character (take last character if multiple)
    const singleChar = value.length > 1 ? value[value.length - 1] || '' : value;

    newLetters[index] = singleChar.toUpperCase();
    setLetters(newLetters);

    // Auto-advance to next unlocked box when a letter is entered
    if (value && index < letters.length - 1) {
      const nextIndex = index + 1;
      // Skip over locked letters to find next editable box
      let targetIndex = nextIndex;
      while (targetIndex < letters.length && lockedLetters.has(targetIndex)) {
        targetIndex++;
      }
      if (targetIndex < letters.length) {
        inputRefs.current[targetIndex]?.focus();
      }
    }
  };

  /**
   * Handle keyboard navigation between letter boxes
   * - Backspace: Move to previous box if current is empty
   * - Arrow keys: Navigate left/right between boxes
   * - Respects locked letters when navigating with backspace
   */
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!canInteract) return;

    if (e.key === 'Backspace' && !letters[index] && index > 0) {
      // Move to previous unlocked box on backspace if current is empty
      const prevIndex = index - 1;
      let targetIndex = prevIndex;
      while (targetIndex >= 0 && lockedLetters.has(targetIndex)) {
        targetIndex--;
      }
      if (targetIndex >= 0) {
        inputRefs.current[targetIndex]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      const prevIndex = index - 1;
      inputRefs.current[prevIndex]?.focus();
    } else if (e.key === 'ArrowRight' && index < letters.length - 1) {
      const nextIndex = index + 1;
      inputRefs.current[nextIndex]?.focus();
    }
  };

  /**
   * Handle "Try Again" action after wrong attempt
   * - Keeps correct letters locked with their values
   * - Clears incorrect letters for retry
   * - Focuses first unlocked box for continued input
   */
  const handleTryAgain = () => {
    const correctAnswerNoSpaces = correctAnswer.replace(/\s/g, '');
    const newLockedLetters = new Set<number>();
    const newLetters = [...letters];

    // Check each letter: lock correct ones, clear wrong ones
    letters.forEach((letter, index) => {
      const expectedLetter = caseSensitive
        ? correctAnswerNoSpaces[index]
        : correctAnswerNoSpaces[index]?.toLowerCase();
      const userLetter = caseSensitive ? letter : letter.toLowerCase();

      if (userLetter === expectedLetter) {
        newLockedLetters.add(index); // Lock correct letters
      } else {
        newLetters[index] = ''; // Clear incorrect letters
      }
    });

    setLetters(newLetters);
    setLockedLetters(newLockedLetters);
    tryAgain();

    // Auto-focus first editable box
    const firstUnlocked = newLetters.findIndex((_, idx) => !newLockedLetters.has(idx));
    if (firstUnlocked !== -1) {
      setTimeout(() => inputRefs.current[firstUnlocked]?.focus(), 0);
    }
  };

  /**
   * Handle "Show Answer" action
   * - Fills all boxes with correct answer
   * - Marks answer as revealed (affects scoring and visual feedback)
   * - Grey check marks will appear instead of green
   */
  const handleShowAnswer = () => {
    const correctAnswerNoSpaces = correctAnswer.replace(/\s/g, '');
    const correctLetters = correctAnswerNoSpaces
      .split('')
      .map((char) => (caseSensitive ? char : char.toUpperCase()));

    setLetters(correctLetters);
    revealCorrectAnswer();
  };

  // Persist interaction state to database (includes letterAttempts history)
  useEffect(() => {
    if (mode === 'play') {
      updateInteractionData({ ...state });
    }
  }, [mode, state, updateInteractionData]);

  // Persist calculated score
  useEffect(() => {
    if (mode === 'play') {
      updateEarnedScore(score);
    }
  }, [mode, score, updateEarnedScore]);

  // Persist attempts count
  useEffect(() => {
    if (mode === 'play') {
      updateAttemptsCount(attemptsCount);
    }
  }, [mode, attemptsCount, updateAttemptsCount]);

  // Auto-fill correct answer when it's revealed (either manually or after 5 attempts)
  useEffect(() => {
    if (state.hasRevealedCorrectAnswer && state.correctAttempt?.wasRevealed) {
      const correctAnswerNoSpaces = correctAnswer.replace(/\s/g, '');
      const correctLetters = correctAnswerNoSpaces
        .split('')
        .map((char) => (caseSensitive ? char : char.toUpperCase()));

      setLetters(correctLetters);
    }
  }, [
    state.hasRevealedCorrectAnswer,
    state.correctAttempt?.wasRevealed,
    correctAnswer,
    caseSensitive,
  ]);

  return (
    <ViewPluginWrapper
      isComplete={mode === 'preview' ? isCompleted : blockWithProgress.block_progress?.is_completed}
      playbackMode={playbackMode}
      mode={mode}
      reset={reset}
      weight={weight}
    >
      <PlayPluginWrapper hint={hint}>
        <RichTextRenderer editorState={questionState} />

        <div className='flex flex-col gap-4 py-6'>
          {/* Letter boxes */}
          <div className='flex flex-wrap items-center justify-center gap-2'>
            {answerStructure.map((item, structureIndex) => {
              if (item.type === 'space') {
                return <div key={`space-${structureIndex}`} className='w-4' />;
              }

              const letterIndex = item.index;
              const isLocked = lockedLetters.has(letterIndex);
              const letter = letters[letterIndex] || '';

              // Get real-time feedback for this letter during interaction
              const feedback = letterFeedback[letterIndex];
              const isCorrect = feedback === 'correct';
              const isIncorrect = feedback === 'incorrect';
              const hasChecked = !canInteract;

              // Get attempt history for this letter position from stored attempts
              const correctAnswerNoSpaces = correctAnswer.replace(/\s/g, '');
              const correctLetterAtPosition = caseSensitive
                ? correctAnswerNoSpaces[letterIndex]
                : correctAnswerNoSpaces[letterIndex]?.toLowerCase();

              const attemptsAtPosition = letterAttempts[letterIndex] || [];

              // Filter attempts into wrong and correct categories
              const wrongAttemptsAtPosition = attemptsAtPosition.filter((attemptedLetter) => {
                const normalizedAttempt = caseSensitive
                  ? attemptedLetter
                  : attemptedLetter.toLowerCase();
                return normalizedAttempt !== correctLetterAtPosition;
              });

              // Check if user earned this letter (it's in their attempt history)
              const wasEarnedByUser = attemptsAtPosition.some((attemptedLetter) => {
                const normalizedAttempt = caseSensitive
                  ? attemptedLetter
                  : attemptedLetter.toLowerCase();
                return normalizedAttempt === correctLetterAtPosition;
              });

              // Check if this letter is currently correct
              const isCurrentlyCorrect = isCorrect || isLocked;

              // Determine if this letter was revealed (correct but not earned)
              const wasRevealed = isCurrentlyCorrect && !wasEarnedByUser && answerWasRevealed;

              // Show feedback marks when there are attempts and the answer has been checked or completed
              const shouldShowFeedback =
                (wrongAttemptsAtPosition.length > 0 || isCurrentlyCorrect) &&
                (isLocked || hasChecked || isCompleted);

              return (
                <div key={`letter-${letterIndex}`} className='relative'>
                  <input
                    ref={(el) => {
                      inputRefs.current[letterIndex] = el;
                    }}
                    type='text'
                    maxLength={1}
                    value={letter}
                    onChange={(e) => handleLetterChange(letterIndex, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(letterIndex, e)}
                    disabled={!canInteract || isLocked}
                    className={cn(
                      'focus:ring-primary flex h-14 w-14 items-center justify-center rounded border-2 text-center text-2xl font-bold uppercase transition-colors focus:ring-2 focus:outline-none',
                      {
                        // Show green ONLY after checking OR if locked from previous attempt
                        'border-success bg-success/30 text-success-foreground':
                          isCorrect && (isLocked || hasChecked),
                        // Locked letters are non-editable
                        'cursor-not-allowed': isLocked,
                        // Show red ONLY after checking
                        'border-danger bg-danger/30 text-danger-foreground':
                          isIncorrect && hasChecked,
                        // Active state while typing - normal blue border
                        'border-primary bg-background': canInteract && !isLocked,
                        // Disabled state (checked but no feedback)
                        'border-muted bg-muted/20 text-muted-foreground cursor-not-allowed':
                          hasChecked && !isCorrect && !isIncorrect,
                      },
                    )}
                  />

                  {/* Status Indicators - Multiple Check/X marks based on attempt history */}
                  {shouldShowFeedback && (
                    <div className='absolute -top-2 -right-2 flex max-w-[4rem] flex-row-reverse flex-wrap items-center justify-end gap-0.5'>
                      {/* Checkmark: Green if user earned it, Grey if it was revealed */}
                      {isCurrentlyCorrect && (
                        <Check
                          size={12}
                          className={cn('rounded-full p-0.5', {
                            'text-success-foreground bg-success': wasEarnedByUser, // Green for earned letters
                            'text-muted-foreground bg-muted': wasRevealed, // Grey for revealed letters
                          })}
                        />
                      )}
                      {/* Red X marks for each wrong attempt at this position */}
                      {wrongAttemptsAtPosition.map((_, wrongIndex) => (
                        <X
                          key={`wrong-${letterIndex}-${wrongIndex}`}
                          size={12}
                          className='text-danger-foreground bg-danger rounded-full p-0.5'
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className='text-muted-foreground font-secondary pb-1 text-xs'>
          Attempts: <span className='font-normal'>{attemptsCount}</span>
        </div>

        <div className='w-full pb-4'>
          {state.showCheckIfAnswerIsCorrectButton && (
            <CheckAnswerButton disabled={!userInput.trim()} onClick={checkAnswer} />
          )}

          {state.showContinueButton && (
            <RenderFeedback
              color='success'
              icon={<PartyPopper />}
              label={state.hasRevealedCorrectAnswer ? 'Answer Revealed' : 'Correct!'}
              score={score}
              hasBeenPlayed={blockWithProgress.block_progress?.is_completed}
              actions={
                <div className='flex'>
                  {!blockWithProgress.block_progress?.is_completed && (
                    <BlockActionButton
                      onClick={handleContinue}
                      loading={loading}
                      isLastBlock={is_last_block}
                      disabled={mode === 'preview'}
                    />
                  )}

                  {!isExplanationBottomSheetOpen && state.canShowExplanationButton && (
                    <AnimateInButtonWrapper>
                      <OutlineButton
                        className='ml-4 rounded-full'
                        onClick={() => setExplanationState(explanationState)}
                      >
                        Why?
                      </OutlineButton>
                    </AnimateInButtonWrapper>
                  )}
                </div>
              }
            />
          )}

          {state.showTryAgainButton && (
            <RenderFeedback
              color='destructive'
              icon={<XCircle />}
              label='Incorrect!'
              hasBeenPlayed={blockWithProgress.block_progress?.is_completed}
              actions={
                <div className='flex items-center space-x-4'>
                  <TryAgainButton onClick={handleTryAgain} />
                  {state.showShowAnswerButton && <ShowAnswerButton onClick={handleShowAnswer} />}
                </div>
              }
            />
          )}
        </div>
      </PlayPluginWrapper>
    </ViewPluginWrapper>
  );
}

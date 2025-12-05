import { useEffect, useMemo, useRef, useState } from 'react';
import { PartyPopper, XCircle } from 'lucide-react';

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
  const {
    settings: { playbackMode, weight },
    content: { questionState, correctAnswer, explanationState, hint, caseSensitive },
  } = blockWithProgress.block as FillInTheBlankPluginType;

  const { is_last_block } = blockWithProgress;

  const { isExplanationBottomSheetOpen, setExplanationState, mode } = useStore();

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

  // Extract interaction data from DB
  const initialInteractionData: FillInTheBlankInteractionType | null = useMemo(() => {
    if (mode === 'preview') return null;

    const dbInteractionData = blockWithProgress.block_progress?.interaction_data;
    return isFillInTheBlankInteraction(dbInteractionData) ? dbInteractionData : null;
  }, [blockWithProgress.block_progress?.interaction_data, mode]);

  // Get current interaction data from payload if available
  const parsedPayloadData: FillInTheBlankInteractionType | null = useMemo(() => {
    const data = payload?.interaction_data;
    return isFillInTheBlankInteraction(data) ? data : null;
  }, [payload?.interaction_data]);

  // Use the most recent data (payload takes precedence over initial DB data)
  const currentInteractionData = parsedPayloadData || initialInteractionData;

  const {
    state,
    userInput,
    letterFeedback,
    updateInput,
    checkAnswer,
    revealCorrectAnswer,
    isCompleted,
    tryAgain,
    canInteract,
    score,
    reset,
    attemptsCount,
  } = useFillInTheBlankInteraction(currentInteractionData, correctAnswer, caseSensitive);

  // Create structure for letter boxes (including spaces)
  const answerStructure = useMemo(() => {
    const structure: Array<{ type: 'letter' | 'space'; index: number }> = [];
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

  // Local state for letter boxes
  const [letters, setLetters] = useState<string[]>([]);
  const [lockedLetters, setLockedLetters] = useState<Set<number>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize letters array based on answer structure
  useEffect(() => {
    const letterCount = answerStructure.filter((item) => item.type === 'letter').length;
    setLetters(new Array(letterCount).fill(''));
    inputRefs.current = new Array(letterCount).fill(null);
  }, [answerStructure]);

  // Clear letters when state is reset (e.g., on refresh or reset button)
  useEffect(() => {
    if (!state.correctAttempt && state.wrongAttempts.length === 0) {
      const letterCount = answerStructure.filter((item) => item.type === 'letter').length;
      setLetters(new Array(letterCount).fill(''));
      setLockedLetters(new Set());
      setFocusedIndex(0);
    }
  }, [state, answerStructure]);

  // Update userInput when letters change - reconstruct with spaces
  useEffect(() => {
    // Reconstruct the answer with spaces in the correct positions
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

  // Handle keyboard input
  const handleLetterChange = (index: number, value: string) => {
    if (!canInteract || lockedLetters.has(index)) return;

    const newLetters = [...letters];

    // Only allow single character
    const singleChar = value.length > 1 ? value[value.length - 1] || '' : value;

    newLetters[index] = singleChar.toUpperCase();
    setLetters(newLetters);

    // Move to next box if a letter was entered
    if (value && index < letters.length - 1) {
      const nextIndex = index + 1;
      // Skip locked letters
      let targetIndex = nextIndex;
      while (targetIndex < letters.length && lockedLetters.has(targetIndex)) {
        targetIndex++;
      }
      if (targetIndex < letters.length) {
        setFocusedIndex(targetIndex);
        inputRefs.current[targetIndex]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!canInteract) return;

    if (e.key === 'Backspace' && !letters[index] && index > 0) {
      // Move to previous box on backspace if current is empty
      const prevIndex = index - 1;
      // Skip locked letters
      let targetIndex = prevIndex;
      while (targetIndex >= 0 && lockedLetters.has(targetIndex)) {
        targetIndex--;
      }
      if (targetIndex >= 0) {
        setFocusedIndex(targetIndex);
        inputRefs.current[targetIndex]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      const prevIndex = index - 1;
      setFocusedIndex(prevIndex);
      inputRefs.current[prevIndex]?.focus();
    } else if (e.key === 'ArrowRight' && index < letters.length - 1) {
      const nextIndex = index + 1;
      setFocusedIndex(nextIndex);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  // Reset locked letters when trying again
  const handleTryAgain = () => {
    // Keep correct letters locked, clear wrong ones
    const correctAnswerNoSpaces = correctAnswer.replace(/\s/g, '');
    const newLockedLetters = new Set<number>();
    const newLetters = [...letters];

    letters.forEach((letter, index) => {
      const expectedLetter = caseSensitive
        ? correctAnswerNoSpaces[index]
        : correctAnswerNoSpaces[index]?.toLowerCase();
      const userLetter = caseSensitive ? letter : letter.toLowerCase();

      if (userLetter === expectedLetter) {
        newLockedLetters.add(index);
      } else {
        // Clear wrong letters
        newLetters[index] = '';
      }
    });

    setLetters(newLetters);
    setLockedLetters(newLockedLetters);
    tryAgain();

    // Focus first unlocked box
    const firstUnlocked = newLetters.findIndex((_, idx) => !newLockedLetters.has(idx));
    if (firstUnlocked !== -1) {
      setFocusedIndex(firstUnlocked);
      setTimeout(() => inputRefs.current[firstUnlocked]?.focus(), 0);
    }
  };

  // Handle showing the answer
  const handleShowAnswer = () => {
    const correctAnswerNoSpaces = correctAnswer.replace(/\s/g, '');
    const correctLetters = correctAnswerNoSpaces.split('').map((char) =>
      caseSensitive ? char : char.toUpperCase(),
    );

    setLetters(correctLetters);
    revealCorrectAnswer();
  };

  useEffect(() => {
    if (mode === 'play') {
      updateInteractionData({ ...state });
    }
  }, [mode, state, updateInteractionData]);

  useEffect(() => {
    if (mode === 'play') {
      updateEarnedScore(score);
    }
  }, [mode, score, updateEarnedScore]);

  useEffect(() => {
    if (mode === 'play') {
      updateAttemptsCount(attemptsCount);
    }
  }, [mode, attemptsCount, updateAttemptsCount]);

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

              // Get feedback for this letter
              const feedback = letterFeedback[letterIndex];
              const isCorrect = feedback === 'correct';
              const isIncorrect = feedback === 'incorrect';
              const hasChecked = !canInteract;

              return (
                <input
                  key={`letter-${letterIndex}`}
                  ref={(el) => {
                    inputRefs.current[letterIndex] = el;
                  }}
                  type='text'
                  maxLength={1}
                  value={letter}
                  onChange={(e) => handleLetterChange(letterIndex, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(letterIndex, e)}
                  onFocus={() => setFocusedIndex(letterIndex)}
                  disabled={!canInteract || isLocked}
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded border-2 text-center text-2xl font-bold uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-primary',
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
                  autoFocus={letterIndex === 0}
                />
              );
            })}
          </div>
        </div>

        <div className='text-muted-foreground font-secondary pb-1 text-xs'>
          Attempts: <span className='font-normal'>{attemptsCount}</span> | Score:{' '}
          <span className='font-normal'>{score}</span>
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

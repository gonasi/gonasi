import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, PartyPopper, Settings, X, XCircle } from 'lucide-react';

import {
  EMPTY_LEXICAL_STATE,
  FillInTheBlankContentSchema,
  type FillInTheBlankContentSchemaTypes,
  FillInTheBlankSchema,
  FillInTheBlankSettingsSchema,
  type FillInTheBlankSettingsSchemaTypes,
  FillInTheBlankStateInteractionSchema,
} from '@gonasi/schemas/plugins';

import { useFillInTheBlankInteraction } from './hooks/useFillInTheBlankInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { RenderFeedback } from '../../common/RenderFeedback';
import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { createPlugin } from '../../core';
import { calculateFillInTheBlankScore } from './utils';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import {
  AnimateInButtonWrapper,
  BlockActionButton,
  CheckAnswerButton,
  OutlineButton,
  ShowAnswerButton,
  TryAgainButton,
} from '~/components/ui/button';
import {
  GoCheckBoxField,
  GoInputField,
  GoRichTextInputField,
  GoTextAreaField,
} from '~/components/ui/forms/elements';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { cn } from '~/lib/utils';
import { useStore } from '~/store';

/**
 * Default content for new Fill in the Blank blocks
 */
const defaultContent: FillInTheBlankContentSchemaTypes = {
  questionState: EMPTY_LEXICAL_STATE,
  correctAnswer: '',
  explanationState: EMPTY_LEXICAL_STATE,
  caseSensitive: false,
};

/**
 * Default settings for new Fill in the Blank blocks
 */
const defaultSettings: FillInTheBlankSettingsSchemaTypes = {
  playbackMode: 'inline',
  weight: 3,
};

/**
 * Fill in the Blank Plugin
 *
 * Refactored using the new plugin architecture.
 * Features Wordle-like letter-by-letter feedback with individual input boxes.
 *
 * Before: ~730 lines (Builder + View)
 * After: ~490 lines (including complex UI logic)
 * Reduction: ~33%
 */
export const FillInTheBlankPlugin = createPlugin({
  pluginType: 'fill_in_the_blank',

  metadata: {
    name: 'Fill in the Blank',
    description: 'Text input question with letter-by-letter feedback',
    icon: 'PenLine',
    category: 'quiz',
  },

  schemas: {
    builder: FillInTheBlankSchema,
    content: FillInTheBlankContentSchema,
    settings: FillInTheBlankSettingsSchema,
    interaction: FillInTheBlankStateInteractionSchema as any,
  },

  defaults: {
    content: defaultContent,
    settings: defaultSettings,
  },

  hooks: {
    useInteraction: useFillInTheBlankInteraction,
  },

  /**
   * Builder UI - Form fields for content creation
   */
  renderBuilder: () => {
    return (
      <>
        <GoRichTextInputField
          name='content.questionState'
          labelProps={{ children: 'Question', required: true }}
          placeholder='Type your question here...'
          description='What question should learners answer by filling in the blank?'
        />
        <GoInputField
          name='content.correctAnswer'
          labelProps={{ children: 'Correct Answer', required: true }}
          inputProps={{ placeholder: 'Enter the correct answer...' }}
          description='The exact answer learners need to provide (one or two words).'
        />
        <GoCheckBoxField
          name='content.caseSensitive'
          labelProps={{ children: 'Case Sensitive' }}
          description='Should the answer be case-sensitive? (e.g., "Paris" vs "paris")'
        />
        <GoRichTextInputField
          name='content.explanationState'
          labelProps={{ children: 'Why is that the answer?', required: true }}
          placeholder='Share your wisdom...'
          description='Help learners understand why this is the correct answer.'
        />
        <GoTextAreaField
          name='content.hint'
          labelProps={{ children: 'Need a hint?' }}
          textareaProps={{}}
          description={`Give learners a gentle nudge if they're stuck (optional).`}
        />
      </>
    );
  },

  /**
   * Settings popover - Plugin configuration
   */
  renderSettings: ({ playbackMode }) => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Settings
            className='transition-transform duration-200 hover:scale-105 hover:rotate-15 hover:cursor-pointer'
            size={20}
          />
        </PopoverTrigger>
        <PopoverContent className='w-full max-w-md'>
          <div className='grid gap-4'>
            <div className='space-y-2'>
              <h4 className='leading-none font-medium'>Block settings</h4>
              <p className='text-muted-foreground text-sm'>
                Tweak how this block behaves, your rules, your way!
              </p>
            </div>
            <div className='grid gap-2'>
              <BlockWeightField name='settings.weight' />
              <PlaybackModeField name='settings.playbackMode' watchValue={playbackMode} />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  },

  /**
   * View UI - Interactive letter-by-letter input
   */
  renderView: function FillInTheBlankView({
    interaction,
    content,
    settings,
    mode,
    blockWithProgress,
    loading,
    handleContinue,
  }) {
    const { isExplanationBottomSheetOpen, setExplanationState } = useStore();

    // Determine if answer was revealed (not earned)
    const answerWasRevealed =
      interaction.state.hasRevealedCorrectAnswer || interaction.state.correctAttempt?.wasRevealed;

    // Create structure for letter boxes (including spaces)
    const answerStructure = useMemo(() => {
      const structure: { type: 'letter' | 'space'; index: number }[] = [];
      let letterIndex = 0;

      for (let i = 0; i < content.correctAnswer.length; i++) {
        if (content.correctAnswer[i] === ' ') {
          structure.push({ type: 'space', index: i });
        } else {
          structure.push({ type: 'letter', index: letterIndex });
          letterIndex++;
        }
      }
      return structure;
    }, [content.correctAnswer]);

    // Local UI state for managing individual letter boxes
    const [letters, setLetters] = useState<string[]>([]);
    const [lockedLetters, setLockedLetters] = useState<Set<number>>(new Set());
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Initialize letters array and restore from saved state
    useEffect(() => {
      const letterCount = answerStructure.filter((item) => item.type === 'letter').length;

      if (interaction.state.userAnswer) {
        const savedAnswer = interaction.state.userAnswer;
        const savedAnswerNoSpaces = savedAnswer.replace(/\s/g, '');
        const restoredLetters = savedAnswerNoSpaces
          .split('')
          .map((char) => char.toUpperCase())
          .slice(0, letterCount);

        while (restoredLetters.length < letterCount) {
          restoredLetters.push('');
        }

        setLetters(restoredLetters);
      } else {
        setLetters(new Array(letterCount).fill(''));
      }

      inputRefs.current = new Array(letterCount).fill(null);
    }, [answerStructure, interaction.state.userAnswer]);

    // Restore locked letters from saved state
    useEffect(() => {
      if (interaction.state.userAnswer && letters.length > 0) {
        const correctAnswerNoSpaces = content.correctAnswer.replace(/\s/g, '');
        const savedAnswerNoSpaces = interaction.state.userAnswer.replace(/\s/g, '');
        const newLockedLetters = new Set<number>();

        for (let i = 0; i < savedAnswerNoSpaces.length; i++) {
          const expectedLetter = content.caseSensitive
            ? correctAnswerNoSpaces[i]
            : correctAnswerNoSpaces[i]?.toLowerCase();
          const userLetter = content.caseSensitive
            ? savedAnswerNoSpaces[i]
            : savedAnswerNoSpaces[i]?.toLowerCase();

          if (userLetter === expectedLetter) {
            newLockedLetters.add(i);
          }
        }

        setLockedLetters(newLockedLetters);
      }
    }, [
      interaction.state.userAnswer,
      letters.length,
      content.correctAnswer,
      content.caseSensitive,
    ]);

    // Clear letters when state is reset
    useEffect(() => {
      if (!interaction.state.correctAttempt && interaction.state.wrongAttempts.length === 0) {
        const letterCount = answerStructure.filter((item) => item.type === 'letter').length;
        setLetters(new Array(letterCount).fill(''));
        setLockedLetters(new Set());
      }
    }, [interaction.state, answerStructure]);

    // Synchronize individual letter boxes with the full userInput string
    useEffect(() => {
      let reconstructed = '';
      let letterIndex = 0;

      for (let i = 0; i < content.correctAnswer.length; i++) {
        if (content.correctAnswer[i] === ' ') {
          reconstructed += ' ';
        } else {
          reconstructed += letters[letterIndex] || '';
          letterIndex++;
        }
      }

      interaction.updateInput(reconstructed.trim());
    }, [letters, content.correctAnswer, interaction]);

    // Handle letter input changes
    const handleLetterChange = (index: number, value: string) => {
      if (!interaction.canInteract || lockedLetters.has(index)) return;

      const newLetters = [...letters];
      const singleChar = value.length > 1 ? value[value.length - 1] || '' : value;
      newLetters[index] = singleChar.toUpperCase();
      setLetters(newLetters);

      // Auto-advance to next unlocked box
      if (value && index < letters.length - 1) {
        let targetIndex = index + 1;
        while (targetIndex < letters.length && lockedLetters.has(targetIndex)) {
          targetIndex++;
        }
        if (targetIndex < letters.length) {
          inputRefs.current[targetIndex]?.focus();
        }
      }
    };

    // Handle keyboard navigation
    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!interaction.canInteract) return;

      if (e.key === 'Backspace' && !letters[index] && index > 0) {
        let targetIndex = index - 1;
        while (targetIndex >= 0 && lockedLetters.has(targetIndex)) {
          targetIndex--;
        }
        if (targetIndex >= 0) {
          inputRefs.current[targetIndex]?.focus();
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < letters.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    // Handle "Try Again" - keep correct letters, clear wrong ones
    const handleTryAgain = () => {
      const correctAnswerNoSpaces = content.correctAnswer.replace(/\s/g, '');
      const newLockedLetters = new Set<number>();
      const newLetters = [...letters];

      letters.forEach((letter, index) => {
        const expectedLetter = content.caseSensitive
          ? correctAnswerNoSpaces[index]
          : correctAnswerNoSpaces[index]?.toLowerCase();
        const userLetter = content.caseSensitive ? letter : letter.toLowerCase();

        if (userLetter === expectedLetter) {
          newLockedLetters.add(index);
        } else {
          newLetters[index] = '';
        }
      });

      setLetters(newLetters);
      setLockedLetters(newLockedLetters);
      interaction.tryAgain();

      const firstUnlocked = newLetters.findIndex((_, idx) => !newLockedLetters.has(idx));
      if (firstUnlocked !== -1) {
        setTimeout(() => inputRefs.current[firstUnlocked]?.focus(), 0);
      }
    };

    // Handle "Show Answer" - fill all boxes
    const handleShowAnswer = () => {
      const correctAnswerNoSpaces = content.correctAnswer.replace(/\s/g, '');
      const correctLetters = correctAnswerNoSpaces
        .split('')
        .map((char) => (content.caseSensitive ? char : char.toUpperCase()));

      setLetters(correctLetters);
      interaction.revealCorrectAnswer();
    };

    // Auto-fill when answer is revealed
    useEffect(() => {
      if (
        interaction.state.hasRevealedCorrectAnswer &&
        interaction.state.correctAttempt?.wasRevealed
      ) {
        const correctAnswerNoSpaces = content.correctAnswer.replace(/\s/g, '');
        const correctLetters = correctAnswerNoSpaces
          .split('')
          .map((char) => (content.caseSensitive ? char : char.toUpperCase()));

        setLetters(correctLetters);
      }
    }, [
      interaction.state.hasRevealedCorrectAnswer,
      interaction.state.correctAttempt?.wasRevealed,
      content.correctAnswer,
      content.caseSensitive,
    ]);

    return (
      <ViewPluginWrapper
        isComplete={
          mode === 'preview'
            ? interaction.isCompleted
            : blockWithProgress.block_progress?.is_completed
        }
        playbackMode={settings.playbackMode}
        mode={mode}
        reset={interaction.reset}
        weight={settings.weight}
      >
        <PlayPluginWrapper hint={content.hint}>
          <RichTextRenderer editorState={content.questionState} />

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

                const feedback = interaction.letterFeedback[letterIndex];
                const isCorrect = feedback === 'correct';
                const isIncorrect = feedback === 'incorrect';
                const hasChecked = !interaction.canInteract;

                // Get attempt history for this letter position
                const correctAnswerNoSpaces = content.correctAnswer.replace(/\s/g, '');
                const correctLetterAtPosition = content.caseSensitive
                  ? correctAnswerNoSpaces[letterIndex]
                  : correctAnswerNoSpaces[letterIndex]?.toLowerCase();

                const attemptsAtPosition = interaction.letterAttempts[letterIndex] || [];

                const wrongAttemptsAtPosition = attemptsAtPosition.filter((attemptedLetter) => {
                  const normalizedAttempt = content.caseSensitive
                    ? attemptedLetter
                    : attemptedLetter.toLowerCase();
                  return normalizedAttempt !== correctLetterAtPosition;
                });

                const wasEarnedByUser = attemptsAtPosition.some((attemptedLetter) => {
                  const normalizedAttempt = content.caseSensitive
                    ? attemptedLetter
                    : attemptedLetter.toLowerCase();
                  return normalizedAttempt === correctLetterAtPosition;
                });

                const isCurrentlyCorrect = isCorrect || isLocked;
                const wasRevealed = isCurrentlyCorrect && !wasEarnedByUser && answerWasRevealed;

                const shouldShowFeedback =
                  (wrongAttemptsAtPosition.length > 0 || isCurrentlyCorrect) &&
                  (isLocked || hasChecked || interaction.isCompleted);

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
                      disabled={!interaction.canInteract || isLocked}
                      className={cn(
                        'focus:ring-primary flex h-14 w-14 items-center justify-center rounded border-2 text-center text-2xl font-bold uppercase transition-colors focus:ring-2 focus:outline-none',
                        {
                          'border-success bg-success/30 text-success-foreground':
                            isCorrect && (isLocked || hasChecked),
                          'cursor-not-allowed': isLocked,
                          'border-danger bg-danger/30 text-danger-foreground':
                            isIncorrect && hasChecked,
                          'border-primary bg-background': interaction.canInteract && !isLocked,
                          'border-muted bg-muted/20 text-muted-foreground cursor-not-allowed':
                            hasChecked && !isCorrect && !isIncorrect,
                        },
                      )}
                    />

                    {/* Status Indicators */}
                    {shouldShowFeedback && (
                      <div className='absolute -top-2 -right-2 flex max-w-[4rem] flex-row-reverse flex-wrap items-center justify-end gap-0.5'>
                        {isCurrentlyCorrect && (
                          <Check
                            size={12}
                            className={cn('rounded-full p-0.5', {
                              'text-success-foreground bg-success': wasEarnedByUser,
                              'text-muted-foreground bg-muted': wasRevealed,
                            })}
                          />
                        )}
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
            Attempts: <span className='font-normal'>{interaction.attemptsCount}</span>
          </div>

          <div className='w-full pb-4'>
            {interaction.state.showCheckIfAnswerIsCorrectButton && (
              <CheckAnswerButton
                disabled={!interaction.userInput.trim()}
                onClick={interaction.checkAnswer}
              />
            )}

            {interaction.state.showContinueButton && (
              <RenderFeedback
                color='success'
                icon={<PartyPopper />}
                label={interaction.state.hasRevealedCorrectAnswer ? 'Answer Revealed' : 'Correct!'}
                score={interaction.score}
                hasBeenPlayed={blockWithProgress.block_progress?.is_completed}
                actions={
                  <div className='flex'>
                    {!blockWithProgress.block_progress?.is_completed && (
                      <BlockActionButton
                        onClick={handleContinue}
                        loading={loading}
                        isLastBlock={blockWithProgress.is_last_block}
                        disabled={mode === 'preview'}
                      />
                    )}

                    {!isExplanationBottomSheetOpen &&
                      interaction.state.canShowExplanationButton && (
                        <AnimateInButtonWrapper>
                          <OutlineButton
                            className='ml-4 rounded-full'
                            onClick={() => setExplanationState(content.explanationState)}
                          >
                            Why?
                          </OutlineButton>
                        </AnimateInButtonWrapper>
                      )}
                  </div>
                }
              />
            )}

            {interaction.state.showTryAgainButton && (
              <RenderFeedback
                color='destructive'
                icon={<XCircle />}
                label='Incorrect!'
                hasBeenPlayed={blockWithProgress.block_progress?.is_completed}
                actions={
                  <div className='flex items-center space-x-4'>
                    <TryAgainButton onClick={handleTryAgain} />
                    {interaction.state.showShowAnswerButton && (
                      <ShowAnswerButton onClick={handleShowAnswer} />
                    )}
                  </div>
                }
              />
            )}
          </div>
        </PlayPluginWrapper>
      </ViewPluginWrapper>
    );
  },

  /**
   * Scoring logic
   */
  scoring: {
    calculate: (state) => calculateFillInTheBlankScore(state),
    getMaxScore: () => 100,
    getPenaltyFactor: () => 0.2, // 20% penalty per wrong attempt
  },
});

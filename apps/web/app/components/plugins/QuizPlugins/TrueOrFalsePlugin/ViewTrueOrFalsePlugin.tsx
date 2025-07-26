import { useEffect, useMemo } from 'react';
import { Check, PartyPopper, X, XCircle } from 'lucide-react';

import type { BlockInteractionSchemaTypes, BuilderSchemaTypes } from '@gonasi/schemas/plugins';

import { useTrueOrFalseInteraction } from './hooks/useTrueOrFalseInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { RenderFeedback } from '../../common/RenderFeedback';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../PluginRenderers/ViewPluginTypesRenderer';
import { shuffleArray } from '../../utils';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import {
  AnimateInButtonWrapper,
  BlockActionButton,
  CheckAnswerButton,
  OutlineButton,
  ShowAnswerButton,
  TrueOrFalseOptionsButton,
  TryAgainButton,
} from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { useStore } from '~/store';

// Type narrowing
type TrueOrFalsePluginType = Extract<BuilderSchemaTypes, { plugin_type: 'true_or_false' }>;
type TrueOrFalseInteractionType = Extract<
  BlockInteractionSchemaTypes,
  { plugin_type: 'true_or_false' }
>;

export function ViewTrueOrFalsePlugin({ blockWithProgress, mode }: ViewPluginComponentProps) {
  const {
    settings: { playbackMode, layoutStyle, randomization, weight },
    content: { questionState, correctAnswer, explanationState, hint },
  } = blockWithProgress.block as TrueOrFalsePluginType;

  const { isExplanationBottomSheetOpen, setExplanationState, isLastBlock } = useStore();

  const {
    loading,
    payload,
    handleContinue,
    updateInteractionData,
    updateEarnedScore,
    updateAttemptsCount,
  } = useViewPluginCore(
    mode === 'play'
      ? {
          progress: blockWithProgress.block_progress,
          blockWithProgress,
        }
      : null,
  );

  const parsedInteractionData: TrueOrFalseInteractionType | null = useMemo(() => {
    const data = payload?.interaction_data;

    if (
      data &&
      typeof data === 'object' &&
      'plugin_type' in data &&
      data.plugin_type === 'true_or_false'
    ) {
      return data as TrueOrFalseInteractionType;
    }

    return null;
  }, [payload?.interaction_data]);

  const {
    state,
    selectedOption,
    selectOption,
    checkAnswer,
    revealCorrectAnswer,
    isCompleted,
    tryAgain,
    canInteract,
    score,
    reset,
    attemptsCount,
  } = useTrueOrFalseInteraction(parsedInteractionData, correctAnswer);

  // Shuffle options if enabled
  const answerOptions = useMemo(() => {
    const options = [true, false];
    return randomization === 'shuffle' ? shuffleArray(options) : options;
  }, [randomization]);

  // Sync interaction state to payload (for submission)
  useEffect(() => {
    if (mode !== 'play') return;
    updateInteractionData({ ...state });
  }, [mode, state, updateInteractionData]);

  // Sync score
  useEffect(() => {
    if (mode !== 'play') return;
    updateEarnedScore(score);
  }, [mode, score, updateEarnedScore]);

  // Sync attempts
  useEffect(() => {
    if (mode !== 'play') return;
    updateAttemptsCount(attemptsCount);
  }, [mode, attemptsCount, updateAttemptsCount]);

  return (
    <ViewPluginWrapper
      isComplete={isCompleted}
      playbackMode={playbackMode}
      mode={mode}
      reset={reset}
      weight={weight}
    >
      <PlayPluginWrapper hint={hint}>
        <RichTextRenderer editorState={questionState} />

        <div className='flex flex-col gap-4'>
          {/* True/False Option Buttons */}
          <div
            className={cn('gap-4 py-6', {
              'grid grid-cols-1': layoutStyle === 'single',
              'grid grid-cols-2': layoutStyle === 'double',
            })}
          >
            {answerOptions.map((val) => {
              const isSelected = selectedOption === val;
              const icon = val ? <Check /> : <X />;
              const isCorrectAttempt = state.correctAttempt?.selected === val;
              const isWrongAttempt = state.wrongAttempts.some((a) => a.selected === val);
              const isDisabled = !canInteract || isWrongAttempt || isCorrectAttempt;

              return (
                <div key={String(val)} className='relative w-full'>
                  <TrueOrFalseOptionsButton
                    val={val}
                    icon={icon}
                    isSelected={isSelected}
                    isDisabled={isDisabled}
                    selectOption={() => selectOption(val)}
                  />
                  {/* Attempt indicators */}
                  <div className='absolute -top-1.5 -right-1.5 rounded-full'>
                    {isCorrectAttempt && (
                      <Check
                        size={14}
                        className='text-success-foreground bg-success rounded-full p-0.5'
                      />
                    )}
                    {isWrongAttempt && (
                      <X
                        size={14}
                        className='text-danger-foreground bg-danger rounded-full p-0.5'
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attempts Counter */}
        <div className='text-muted-foreground font-secondary pb-1 text-xs'>
          Attempts: <span className='font-normal'>{attemptsCount}</span>
        </div>

        {/* Feedback & Actions */}
        <div className='w-full pb-4'>
          {state.showCheckIfAnswerIsCorrectButton && (
            <CheckAnswerButton disabled={selectedOption === null} onClick={checkAnswer} />
          )}

          {state.showContinueButton && (
            <RenderFeedback
              color='success'
              icon={<PartyPopper />}
              label={state.hasRevealedCorrectAnswer ? 'Answer Revealed' : 'Correct!'}
              score={score}
              hasBeenPlayed={isCompleted}
              actions={
                <div className='flex'>
                  {!isCompleted && (
                    <BlockActionButton
                      onClick={handleContinue}
                      loading={loading}
                      isLastBlock={isLastBlock}
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
              hasBeenPlayed={isCompleted}
              actions={
                <div className='flex items-center space-x-4'>
                  <TryAgainButton onClick={tryAgain} />
                  {state.showShowAnswerButton && <ShowAnswerButton onClick={revealCorrectAnswer} />}
                </div>
              }
            />
          )}
        </div>
      </PlayPluginWrapper>
    </ViewPluginWrapper>
  );
}

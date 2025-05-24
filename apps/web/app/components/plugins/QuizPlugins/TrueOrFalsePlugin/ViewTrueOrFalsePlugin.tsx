import { useEffect } from 'react';
import { useParams } from 'react-router';
import { Check, CheckCheck, PartyPopper, RefreshCw, X, XCircle } from 'lucide-react';

import type {
  TrueOrFalseContentSchemaType,
  TrueOrFalseSettingsSchemaType,
  TrueOrFalseStateInteractionSchemaType,
} from '@gonasi/schemas/plugins';

import { useTrueOrFalseInteraction } from './hooks/useTrueOrFalseInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { RenderFeedback } from '../../common/RenderFeedback';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../ViewPluginTypesRenderer';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import {
  AnimateInButtonWrapper,
  BlockActionButton,
  Button,
  OutlineButton,
} from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { useStore } from '~/store';

export function ViewTrueOrFalsePlugin({ block, mode }: ViewPluginComponentProps) {
  const params = useParams();

  const { playbackMode, layoutStyle } = block.settings as TrueOrFalseSettingsSchemaType;
  const { questionState, correctAnswer, explanationState, hint } =
    block.content as TrueOrFalseContentSchemaType['content'];

  const { isExplanationBottomSheetOpen, setExplanationState, isLastBlock } = useStore();

  // Hook for core view plugin logic (e.g. saving state to backend)
  const { loading, payload, handleContinue, updatePayload } = useViewPluginCore(
    mode === 'play' ? block.id : null,
  );

  // Hook handling answer selection, validation, retry logic
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
  } = useTrueOrFalseInteraction(
    payload?.state as TrueOrFalseStateInteractionSchemaType,
    correctAnswer,
  );

  const attemptsCount = state.wrongAttempts.length + (state.correctAttempt ? 1 : 0);

  // Sync interaction state to payload for persistence
  useEffect(() => {
    if (mode === 'play' && updatePayload) {
      updatePayload({
        plugin_type: 'true_or_false',
        block_id: block.id,
        lesson_id: params.lessonId ?? '',
        is_complete: isCompleted,
        score,
        attempts: attemptsCount,
        state: { ...state },
      });
    }
  }, [state, isCompleted, mode, updatePayload, block.id, params.lessonId, score, attemptsCount]);

  return (
    <ViewPluginWrapper
      isComplete={isCompleted}
      playbackMode={playbackMode}
      mode={mode}
      reset={reset}
    >
      <PlayPluginWrapper hint={hint}>
        {/* Question */}
        <RichTextRenderer editorState={questionState} />

        {/* Answer Options: True / False */}
        <div className='flex flex-col gap-4'>
          <div
            className={cn('gap-4 py-6', {
              'grid grid-cols-1': layoutStyle === 'single',
              'grid grid-cols-2': layoutStyle === 'double',
            })}
          >
            {([true, false] as const).map((val) => {
              const isSelected = selectedOption === val;
              const icon = val ? <Check /> : <X />;
              const isCorrectAttempt = state.correctAttempt?.selected === val;
              const isWrongAttempt = state.wrongAttempts.some((a) => a.selected === val);
              const isDisabled = !canInteract || isWrongAttempt || isCorrectAttempt;

              return (
                <div key={String(val)} className='relative w-full'>
                  <OutlineButton
                    onClick={() => selectOption(val)}
                    leftIcon={icon}
                    className={cn('relative w-full', {
                      'border-secondary bg-secondary/20 hover:bg-secondary-10 hover:border-secondary/80':
                        isSelected,
                    })}
                    disabled={isDisabled}
                  >
                    {val ? 'True' : 'False'}
                  </OutlineButton>

                  {/* Feedback Badge */}
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

        {/* Attempt Info */}
        <div className='text-muted-foreground font-secondary pb-1 text-xs'>
          Attempts: <span className='font-normal'>{attemptsCount}</span>
        </div>

        {/* Interaction Buttons & Feedback */}
        <div className='w-full pb-4'>
          {/* "Check" action */}
          {state.showCheckIfAnswerIsCorrectButton && (
            <div className='flex w-full justify-end'>
              <AnimateInButtonWrapper>
                <Button
                  variant='secondary'
                  className='mb-4 rounded-full'
                  rightIcon={<CheckCheck />}
                  disabled={selectedOption === null}
                  onClick={checkAnswer}
                >
                  Check
                </Button>
              </AnimateInButtonWrapper>
            </div>
          )}

          {/* Correct Answer Feedback */}
          {state.showContinueButton && (
            <RenderFeedback
              color='success'
              icon={<PartyPopper />}
              label={state.hasRevealedCorrectAnswer ? 'Answer Revealed' : 'Correct!'}
              score={score}
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

          {/* Incorrect Answer Feedback */}
          {state.showTryAgainButton && (
            <RenderFeedback
              color='destructive'
              icon={<XCircle />}
              label='Incorrect!'
              actions={
                <div className='flex items-center space-x-4'>
                  <OutlineButton
                    className='rounded-full'
                    rightIcon={<RefreshCw size={16} />}
                    onClick={tryAgain}
                  >
                    Try Again
                  </OutlineButton>

                  {state.showShowAnswerButton && (
                    <Button
                      variant='secondary'
                      className='rounded-full'
                      onClick={revealCorrectAnswer}
                    >
                      Show Answer
                    </Button>
                  )}
                </div>
              }
            />
          )}
        </div>
      </PlayPluginWrapper>
    </ViewPluginWrapper>
  );
}

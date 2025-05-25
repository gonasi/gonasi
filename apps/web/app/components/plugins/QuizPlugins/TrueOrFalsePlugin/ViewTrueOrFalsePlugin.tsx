import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router';
import { Check, PartyPopper, X, XCircle } from 'lucide-react';

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
import { shuffleArray } from '../../utils';
import type { ViewPluginComponentProps } from '../../ViewPluginTypesRenderer';

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

export function ViewTrueOrFalsePlugin({ block, mode }: ViewPluginComponentProps) {
  const params = useParams();

  const { playbackMode, layoutStyle, randomization } =
    block.settings as TrueOrFalseSettingsSchemaType;
  const { questionState, correctAnswer, explanationState, hint } =
    block.content as TrueOrFalseContentSchemaType;

  const { isExplanationBottomSheetOpen, setExplanationState, isLastBlock } = useStore();

  const { loading, payload, handleContinue, updatePayload } = useViewPluginCore(
    mode === 'play' ? block.id : null,
  );

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
  } = useTrueOrFalseInteraction(
    payload?.state as TrueOrFalseStateInteractionSchemaType,
    correctAnswer,
  );

  const answerOptions = useMemo(() => {
    const options = [true, false];
    return randomization === 'shuffle' ? shuffleArray(options) : options;
  }, [randomization]);

  useEffect(() => {
    if (mode === 'play' && updatePayload) {
      updatePayload({
        plugin_type: 'true_or_false',
        block_id: block.id,
        lesson_id: params.lessonId ?? '',
        score,
        attempts: attemptsCount,
        state: { ...state },
      });
    }
  }, [state, isCompleted, mode, updatePayload, block.id, params.lessonId, score, attemptsCount]);

  return (
    <ViewPluginWrapper
      isComplete={mode === 'preview' ? isCompleted : payload?.is_complete}
      playbackMode={playbackMode}
      mode={mode}
      reset={reset}
    >
      <PlayPluginWrapper hint={hint}>
        <RichTextRenderer editorState={questionState} />

        <div className='flex flex-col gap-4'>
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

        <div className='text-muted-foreground font-secondary pb-1 text-xs'>
          Attempts: <span className='font-normal'>{attemptsCount}</span>
        </div>

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
              hasBeenPlayed={payload?.is_complete}
              actions={
                <div className='flex'>
                  {!payload?.is_complete && (
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
              hasBeenPlayed={payload?.is_complete}
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

import { useEffect } from 'react';
import { Check, CheckCheck, PartyPopper, RefreshCw, X, XCircle } from 'lucide-react';

import type { TrueOrFalseInteractionType, TrueOrFalseSchemaType } from '@gonasi/schemas/plugins';

import { useTrueOrFalseInteraction } from './hooks/useTrueOrFalseInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { RenderFeedback } from '../../common/RenderFeedback';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../ViewPluginTypesRenderer.tsx';
import { calculateTrueFalseScore } from './utils';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import {
  AnimateInButtonWrapper,
  BlockActionButton,
  Button,
  OutlineButton,
} from '~/components/ui/button';
import { cn } from '~/lib/utils';

export function ViewTrueOrFalsePlugin({ block, mode }: ViewPluginComponentProps) {
  const {
    loading,
    canRender,
    handleContinue,
    blockInteractionData,
    isLastBlock,
    updatePayload,
    setExplanationState,
    isExplanationBottomSheetOpen,
  } = useViewPluginCore({
    blockId: block.id,
    pluginType: block.plugin_type,
    settings: block.settings,
  });

  const { is_complete, state: blockInteractionStateData } = blockInteractionData ?? {};
  const { playbackMode, layoutStyle } = block.settings;
  const { questionState, correctAnswer, explanationState, hint } =
    block.content as TrueOrFalseSchemaType;

  const shouldShowActionButton = !is_complete && mode !== 'preview';

  const interaction = useTrueOrFalseInteraction(
    blockInteractionStateData as TrueOrFalseInteractionType,
  );

  const { state, selectedOption, selectOption, checkAnswer, revealCorrectAnswer, tryAgain } =
    interaction;

  const userScore = calculateTrueFalseScore({
    isCorrect: state.isCorrect,
    correctAnswerRevealed: state.correctAnswerRevealed,
    wrongAttemptsCount: state.wrongAttempts.length,
  });

  // Sync interaction state with plugin state
  useEffect(() => {
    updatePayload({
      is_complete: state.continue,
      score: userScore,
      attempts: state.attemptsCount,
      state: {
        ...state,
        interactionType: 'true_false',
        continue: state.continue,
        optionSelected: selectedOption,
        correctAttempt: state.correctAttempt,
        wrongAttempts: state.wrongAttempts,
      },
    });
  }, [state, selectedOption, correctAnswer, updatePayload, userScore]);

  if (!canRender) return <></>;

  return (
    <ViewPluginWrapper isComplete={is_complete} playbackMode={playbackMode} mode={mode}>
      <PlayPluginWrapper hint={hint}>
        {/* Question */}
        <RichTextRenderer editorState={questionState} />

        {/* Options: True / False */}
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

              const isCorrectAttempt =
                !!state.correctAttempt && state.correctAttempt.selected === val;

              const isWrongAttempt = !!state.wrongAttempts?.some(
                (attempt) => attempt.selected === val,
              );

              const isDisabled =
                isCorrectAttempt || isWrongAttempt || state.continue || state.isCorrect !== null;

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

                  {/* Indicator icon for selected attempts */}
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

        {/* Attempt count */}
        <div className='text-muted-foreground font-secondary pb-1 text-xs'>
          Attempts: <span className='font-normal'>{state.attemptsCount}</span>
        </div>

        {/* Action buttons: Check, Continue, Try Again */}
        <div className='w-full pb-4'>
          {/* Check button (before answer is validated) */}
          {!state.continue && state.isCorrect === null && (
            <div className='flex w-full justify-end'>
              <AnimateInButtonWrapper>
                <Button
                  variant='secondary'
                  className='mb-4 rounded-full'
                  rightIcon={<CheckCheck />}
                  disabled={selectedOption === null || state.continue}
                  onClick={() => checkAnswer(correctAnswer === 'true')}
                >
                  Check
                </Button>
              </AnimateInButtonWrapper>
            </div>
          )}

          {/* Feedback: Correct */}
          {state.continue && (
            <RenderFeedback
              color='success'
              icon={<PartyPopper />}
              label='Correct!'
              score={userScore}
              actions={
                <div className='flex'>
                  <div>
                    {shouldShowActionButton && (
                      <BlockActionButton
                        onClick={handleContinue}
                        loading={loading}
                        isLastBlock={isLastBlock}
                      />
                    )}
                  </div>
                  <div>
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
                </div>
              }
            />
          )}

          {/* Feedback: Incorrect */}
          {state.isCorrect === false && (
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
                  {!state.continue && (
                    <Button
                      variant='secondary'
                      className='rounded-full'
                      onClick={() => revealCorrectAnswer(correctAnswer === 'true')}
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
      {/* <TrueOrFalseInteractionDebug interaction={interaction} /> */}
    </ViewPluginWrapper>
  );
}

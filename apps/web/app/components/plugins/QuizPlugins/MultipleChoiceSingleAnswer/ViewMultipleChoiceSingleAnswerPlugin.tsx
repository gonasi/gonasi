import { useEffect } from 'react';
import { Check, CheckCheck, PartyPopper, RefreshCw, X, XCircle } from 'lucide-react';

import type {
  MultipleChoiceSingleAnswerInteractionType,
  MultipleChoiceSingleAnswerSchemaType,
} from '@gonasi/schemas/plugins';

import { useMultipleChoiceSingleAnswerInteraction } from './hooks/useMultipleChoiceSingleAnswerInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { RenderFeedback } from '../../common/RenderFeedback';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../upperRend.tsx';
import { calculateMultipleChoiceSingleAnswerScore } from './utils';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import {
  AnimateInButtonWrapper,
  BlockActionButton,
  Button,
  OutlineButton,
} from '~/components/ui/button';
import { cn } from '~/lib/utils';

export function ViewMultipleChoiceSingleAnswerPlugin({ block, mode }: ViewPluginComponentProps) {
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
  const {
    questionState,
    choices: options,
    correctAnswer,
    explanationState,
    hint,
  } = block.content as MultipleChoiceSingleAnswerSchemaType;

  const shouldShowActionButton = !is_complete && mode !== 'preview';

  const interaction = useMultipleChoiceSingleAnswerInteraction(
    correctAnswer, // uuid of correct answer
    blockInteractionStateData as MultipleChoiceSingleAnswerInteractionType,
  );

  const { state, selectedOptionUuid, selectOption, checkAnswer, revealCorrectAnswer, tryAgain } =
    interaction;

  const userScore = calculateMultipleChoiceSingleAnswerScore({
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
        interactionType: 'multiple_choice_single',
        continue: state.continue,
        optionSelected: selectedOptionUuid,
        correctAttempt: state.correctAttempt,
        wrongAttempts: state.wrongAttempts,
      },
    });
  }, [state, selectedOptionUuid, correctAnswer, updatePayload, userScore]);

  if (!canRender) return <></>;

  return (
    <ViewPluginWrapper isComplete={is_complete} playbackMode={playbackMode} mode={mode}>
      <PlayPluginWrapper hint={hint}>
        {/* Question */}
        <RichTextRenderer editorState={questionState} />

        {/* Multiple Choice Options */}
        <div
          className={cn('gap-4 py-6', {
            'flex flex-col': layoutStyle === 'single',
            'grid grid-cols-2': layoutStyle === 'double',
          })}
        >
          {options.map((option) => {
            const isSelected = selectedOptionUuid === option.uuid;

            const isCorrectAttempt =
              !!state.correctAttempt && state.correctAttempt.selected === option.uuid;

            const isWrongAttempt = !!state.wrongAttempts?.some(
              (attempt) => attempt.selected === option.uuid,
            );

            const isDisabled =
              isCorrectAttempt || isWrongAttempt || state.continue || state.isCorrect !== null;

            return (
              <div key={option.uuid} className='relative w-full'>
                <OutlineButton
                  onClick={() => selectOption(option.uuid)}
                  className={cn('relative h-fit w-full justify-start text-left md:max-h-50', {
                    'border-secondary bg-secondary/20 hover:bg-secondary-10 hover:border-secondary/80':
                      isSelected,
                  })}
                  disabled={isDisabled}
                >
                  <div className='flex items-start'>
                    <RichTextRenderer
                      editorState={option.choiceState}
                      className='max-h-30 md:max-h-40'
                    />
                  </div>
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
                    <X size={14} className='text-danger-foreground bg-danger rounded-full p-0.5' />
                  )}
                </div>
              </div>
            );
          })}
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
                  disabled={selectedOptionUuid === null || state.continue}
                  onClick={() => checkAnswer()}
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
                      onClick={() => revealCorrectAnswer()}
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
      {/* <MultipleChoiceSingleAnswerInteractionDebug interaction={interaction} /> */}
    </ViewPluginWrapper>
  );
}

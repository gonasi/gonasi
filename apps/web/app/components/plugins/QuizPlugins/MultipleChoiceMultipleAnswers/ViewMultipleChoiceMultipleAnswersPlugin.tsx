import { useEffect } from 'react';
import { Check, CheckCheck, PartyPopper, RefreshCw, X, XCircle } from 'lucide-react';

import type {
  MultipleChoiceMultipleAnswersInteractionType,
  MultipleChoiceMultipleAnswersSchemaType,
} from '@gonasi/schemas/plugins';

import { useMultipleChoiceMultipleAnswersInteraction } from './hooks/useMultipleChoiceMultipleAnswersInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { RenderFeedback } from '../../common/RenderFeedback';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../viewPluginTypesRenderer';
import { calculateMultipleChoiceMultipleAnswersScore } from './utils';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import {
  AnimateInButtonWrapper,
  BlockActionButton,
  Button,
  OutlineButton,
} from '~/components/ui/button';
import { cn } from '~/lib/utils';

export function ViewMultipleChoiceMultipleAnswersPlugin({ block, mode }: ViewPluginComponentProps) {
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
    correctAnswers,
    explanationState,
    hint,
  } = block.content as MultipleChoiceMultipleAnswersSchemaType;

  const shouldShowActionButton = !is_complete && mode !== 'preview';

  const interaction = useMultipleChoiceMultipleAnswersInteraction(
    correctAnswers,
    blockInteractionStateData as MultipleChoiceMultipleAnswersInteractionType,
  );

  const {
    state,
    selectedOptionsIndex,
    disabledOptionsIndex,
    remainingCorrectToSelect,
    canSelectMore,
    selectOptions,
    checkAnswer,
    revealCorrectAnswer,
    tryAgain,
  } = interaction;

  // Enhanced usage with additional parameters for better scoring
  const userScore = calculateMultipleChoiceMultipleAnswersScore({
    isCorrect: state.isCorrect,
    correctAnswersRevealed: state.correctAnswerRevealed,
    wrongAttemptsCount: state.wrongAttempts.length,
    correctSelectedCount: state.correctAttempt?.selected.length || 0,
    totalCorrectAnswers: correctAnswers.length,
    wrongAttemptsData: state.wrongAttempts,
    correctAnswers,
    // Optional time parameters if you want to track timing
    // timeToAnswer: timeTakenInMilliseconds,
    // maxTimeExpected: 30000, // 30 seconds as an example
  });

  // Sync interaction state with plugin state
  useEffect(() => {
    updatePayload({
      is_complete: state.continue,
      score: userScore,
      attempts: state.attemptsCount,
      state: {
        ...state,
        interactionType: 'multiple_choice_multiple',
        continue: state.continue,
        optionSelected: selectedOptionsIndex,
        correctAttempt: state.correctAttempt,
        wrongAttempts: state.wrongAttempts,
      },
    });
  }, [state, selectedOptionsIndex, correctAnswers, updatePayload, userScore]);

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
          {options.map((option, index) => {
            const isSelected = selectedOptionsIndex?.includes(index) ?? false;

            const isCorrectAttempt =
              !!state.correctAttempt && state.correctAttempt.selected.includes(index);

            const isWrongAttempt = !!state.wrongAttempts?.some((attempt) =>
              attempt.selected.includes(index),
            );

            // Option is disabled if:
            // 1. It's already been marked as correct
            // 2. It's in the disabled options array AND we haven't clicked "Try Again" (state.isCorrect !== false)
            // 3. User has reached selection limit and this option isn't selected
            const isDisabled =
              isCorrectAttempt ||
              ((disabledOptionsIndex?.includes(index) ?? false) && state.isCorrect !== false) ||
              state.continue ||
              isWrongAttempt ||
              (!canSelectMore && !isSelected);

            return (
              <div key={index} className='relative w-full'>
                <OutlineButton
                  onClick={() => selectOptions(index)}
                  className={cn('relative h-fit w-full justify-start text-left md:max-h-50', {
                    'border-secondary bg-secondary/20 hover:bg-secondary-10 hover:border-secondary/80':
                      isSelected,
                    'opacity-50': disabledOptionsIndex?.includes(index),
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
          {state.correctAttempt?.selected && state.correctAttempt.selected.length > 0 && (
            <span className='ml-2'>
              Correct answers found:{' '}
              <span className='font-primary bg-success/50 text-success-foreground rounded-sm p-1'>
                {state.correctAttempt.selected.length}
              </span>
              {' of '}
              <span className='font-primary bg-success/60 text-success-foreground rounded-sm p-1'>
                {correctAnswers.length}
              </span>
            </span>
          )}
        </div>

        {/* Action buttons: Check, Continue, Try Again */}
        <div className='w-full pb-4'>
          {/* Check button (before answer is validated) */}
          {!state.continue && state.isCorrect === null && (
            <div className='flex w-full items-center justify-between'>
              {/* Remaining correct answers indicator */}
              {remainingCorrectToSelect > 0 && state.isCorrect === null ? (
                <div className='font-secondary bg-success/50 rounded-md px-2 py-1 text-xs'>
                  Select{' '}
                  <span className='font-primary bg-success/50 rounded-sm p-1'>
                    {remainingCorrectToSelect}
                  </span>{' '}
                  more correct answer
                  {remainingCorrectToSelect !== 1 ? 's' : ''}
                </div>
              ) : (
                <div />
              )}

              <AnimateInButtonWrapper>
                <Button
                  variant='secondary'
                  className='rounded-full'
                  rightIcon={<CheckCheck />}
                  disabled={
                    selectedOptionsIndex === null ||
                    state.continue ||
                    selectedOptionsIndex.length !== remainingCorrectToSelect
                  }
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
                  {!explanationState && (
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
      {/* <MultipleChoiceMultipleAnswersInteractionDebug interaction={interaction} /> */}
    </ViewPluginWrapper>
  );
}

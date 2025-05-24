import { useEffect, useState } from 'react';
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
import type { ViewPluginComponentProps } from '../../upperRend.tsx';
import { shuffleArray } from '../../utils';
import { calculateMultipleChoiceMultipleAnswersScore } from './utils';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import {
  AnimateInButtonWrapper,
  BlockActionButton,
  Button,
  OutlineButton,
} from '~/components/ui/button';
import { cn } from '~/lib/utils';

function getRandomizedChoices(
  choices: MultipleChoiceMultipleAnswersSchemaType['choices'],
  strategy: 'none' | 'shuffle',
) {
  return strategy === 'shuffle' ? shuffleArray(choices) : choices;
}

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
  const { playbackMode, layoutStyle, randomization } = block.settings;
  const { questionState, choices, correctAnswers, explanationState, hint } =
    block.content as MultipleChoiceMultipleAnswersSchemaType;

  const shouldShowActionButton = !is_complete && mode !== 'preview';

  const interaction = useMultipleChoiceMultipleAnswersInteraction(
    correctAnswers,
    choices.map((choice) => choice.uuid),
    blockInteractionStateData as MultipleChoiceMultipleAnswersInteractionType,
  );

  const [randomizedChoices] = useState(() => getRandomizedChoices(choices, randomization));

  const {
    state,
    selectedOptionsUuids,
    disabledOptionsUuids,
    remainingCorrectToSelect,
    canSelectMore,
    selectOption,
    checkAnswer,
    revealCorrectAnswer,
    tryAgain,
  } = interaction;

  // Track whether we're in a state where selections should be locked
  // until the user clicks "Try Again" after incorrect answer
  const [lockSelectionsUntilTryAgain, setLockSelectionsUntilTryAgain] = useState(false);

  // Update lock state when the correctness state changes
  useEffect(() => {
    if (state.isCorrect === false) {
      // Lock selections when answer is incorrect
      setLockSelectionsUntilTryAgain(true);
    } else if (state.isCorrect === null) {
      // Unlock when Try Again is clicked (which resets isCorrect to null)
      setLockSelectionsUntilTryAgain(false);
    }
  }, [state.isCorrect]);

  // Enhanced usage with additional parameters for better scoring
  const userScore = calculateMultipleChoiceMultipleAnswersScore({
    isCorrect: state.isCorrect,
    correctAnswersRevealed: state.correctAnswerRevealed,
    wrongAttemptsCount: state.wrongAttempts.length,
    correctSelectedCount: state.correctAttempt?.selected.length || 0,
    totalCorrectAnswers: correctAnswers.length,
  });

  // Custom tryAgain handler that also unlocks selections
  const handleTryAgain = () => {
    setLockSelectionsUntilTryAgain(false);
    tryAgain();
  };

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
        selectedOptions: selectedOptionsUuids,
        correctAttempt: state.correctAttempt,
        wrongAttempts: state.wrongAttempts,
      },
    });
  }, [state, selectedOptionsUuids, correctAnswers, updatePayload, userScore]);

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
          {randomizedChoices.map((option) => {
            const optionUuid = option.uuid;
            const isSelected = selectedOptionsUuids?.includes(optionUuid) ?? false;

            const isCorrectAttempt =
              !!state.correctAttempt && state.correctAttempt.selected.includes(optionUuid);

            const isWrongAttempt = !!state.wrongAttempts?.some((attempt) =>
              attempt.selected.includes(optionUuid),
            );

            // Option is disabled if:
            // 1. It's already been marked as correct
            // 2. It's in the disabled options array AND we haven't clicked "Try Again" (state.isCorrect !== false)
            // 3. User has reached selection limit and this option isn't selected
            // 4. User got an incorrect answer and hasn't clicked "Try Again" yet (using our new lock state)
            const isDisabled =
              isCorrectAttempt ||
              ((disabledOptionsUuids?.includes(optionUuid) ?? false) &&
                state.isCorrect !== false) ||
              state.continue ||
              isWrongAttempt ||
              (!canSelectMore && !isSelected) ||
              lockSelectionsUntilTryAgain; // New condition

            return (
              <div key={optionUuid} className='relative w-full'>
                <OutlineButton
                  onClick={() => selectOption(optionUuid)}
                  className={cn('relative h-fit w-full justify-start text-left md:max-h-50', {
                    'border-secondary bg-secondary/20 hover:bg-secondary-10 hover:border-secondary/80':
                      isSelected,
                    'opacity-50':
                      disabledOptionsUuids?.includes(optionUuid) || lockSelectionsUntilTryAgain,
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
                    selectedOptionsUuids === null ||
                    state.continue ||
                    selectedOptionsUuids.length !== remainingCorrectToSelect
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
                    onClick={handleTryAgain} // Use our custom handler
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

import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router';
import { Check, PartyPopper, X, XCircle } from 'lucide-react';

import type {
  MultipleChoiceMultipleAnswersContentSchemaType,
  MultipleChoiceMultipleAnswersInteractionSchemaType,
  MultipleChoiceMultipleAnswersSettingsSchemaType,
} from '@gonasi/schemas/plugins';

import { useMultipleChoiceMultipleAnswersInteraction } from './hooks/useMultipleChoiceMultipleAnswersInteraction';
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
  ChoiceOptionButton,
  OutlineButton,
  ShowAnswerButton,
  TryAgainButton,
} from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { useStore } from '~/store/index.tsx';

/**
 * ViewMultipleChoiceMultipleAnswersPlugin - Renders a multiple choice multiple answers quiz interaction
 *
 * Features:
 * - Multiple answer selection from multiple options
 * - Progressive answer validation with partial credit
 * - Retry mechanism after wrong answers
 * - Score tracking and attempt counting
 * - Optional answer shuffling
 * - Rich text support for questions and answers
 */
export function ViewMultipleChoiceMultipleAnswersPlugin({ block, mode }: ViewPluginComponentProps) {
  const params = useParams();

  // Extract configuration from block settings
  const { playbackMode, layoutStyle, randomization } =
    block.settings as MultipleChoiceMultipleAnswersSettingsSchemaType;

  // Extract content data from block
  const { questionState, choices, correctAnswers, explanationState, hint } =
    block.content as MultipleChoiceMultipleAnswersContentSchemaType;

  // Global app state for explanations and navigation
  const { isExplanationBottomSheetOpen, setExplanationState, isLastBlock } = useStore();

  // Core plugin functionality - handles data persistence and navigation
  const { loading, payload, handleContinue, updatePayload } = useViewPluginCore(
    mode === 'play' ? block.id : null,
  );

  // Multiple choice multiple answers interaction state management
  const {
    state, // Full interaction state (attempts, UI flags, etc.)
    selectedOptionsUuids, // Currently selected option IDs
    selectOption, // Function to select/deselect options
    checkAnswer, // Function to validate the selected answers
    revealCorrectAnswer, // Function to show the correct answers
    isCompleted, // Whether interaction is finished
    tryAgain, // Function to retry after wrong answer
    canInteract, // Whether user can currently interact
    score, // Calculated score based on attempts
    reset, // Function to reset the entire interaction
    attemptsCount,
    remainingCorrectToSelect,
    canSelectMore,
  } = useMultipleChoiceMultipleAnswersInteraction(
    payload?.state as MultipleChoiceMultipleAnswersInteractionSchemaType,
    correctAnswers,
    choices.length,
  );

  // Prepare answer options (shuffle if randomization is enabled)
  const answerOptions = useMemo(() => {
    return randomization === 'shuffle' ? shuffleArray(choices) : choices;
  }, [choices, randomization]);

  // Track whether we're in a state where selections should be locked
  // until the user clicks "Try Again" after incorrect answer
  const lockSelectionsUntilTryAgain = useMemo(() => {
    return state.isCorrect === false && state.showTryAgainButton;
  }, [state.isCorrect, state.showTryAgainButton]);

  // Sync interaction state with backend when in play mode
  useEffect(() => {
    if (mode === 'play' && updatePayload) {
      updatePayload({
        plugin_type: 'multiple_choice_multiple',
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
      isComplete={mode === 'play' ? payload?.is_complete : isCompleted}
      playbackMode={playbackMode}
      mode={mode}
      reset={reset}
    >
      <PlayPluginWrapper hint={hint}>
        {/* Question Section */}
        <RichTextRenderer editorState={questionState} />

        {/* Answer Options Grid/List */}
        <div
          className={cn('gap-4 py-6', {
            'flex flex-col': layoutStyle === 'single', // Vertical layout
            'grid grid-cols-2': layoutStyle === 'double', // 2-column grid
          })}
        >
          {answerOptions.map((option) => {
            const optionUuid = option.uuid;

            // Determine option state for styling and behavior
            const isSelected = selectedOptionsUuids?.includes(optionUuid) ?? false;

            // Check if this option was the correct answer in a previous attempt
            const isCorrectAttempt =
              !!state.correctAttempt && state.correctAttempt.selected.includes(optionUuid);

            // Check if this option was selected incorrectly in a previous attempt
            const isWrongAttempt = !!state.wrongAttempts?.some((attempt) =>
              attempt.selected.includes(optionUuid),
            );

            // Disable interaction for completed attempts, wrong attempts, or when interaction is locked
            const isDisabled =
              !canInteract ||
              isWrongAttempt ||
              isCorrectAttempt ||
              (!canSelectMore && !isSelected) ||
              lockSelectionsUntilTryAgain;

            return (
              <div key={optionUuid} className='relative w-full'>
                {/* Option Button */}
                <ChoiceOptionButton
                  choiceState={option.choiceState}
                  isSelected={isSelected}
                  isDisabled={isDisabled}
                  onClick={() => selectOption(optionUuid)}
                />

                {/* Status Indicators */}
                <div className='absolute -top-1.5 -right-1.5 rounded-full'>
                  {/* Green checkmark for correct answers */}
                  {isCorrectAttempt && (
                    <Check
                      size={14}
                      className='text-success-foreground bg-success rounded-full p-0.5'
                    />
                  )}
                  {/* Red X for wrong answers */}
                  {isWrongAttempt && (
                    <X size={14} className='text-danger-foreground bg-danger rounded-full p-0.5' />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Indicators */}
        <div className='text-muted-foreground font-secondary pb-1 text-xs'>
          Attempts: <span className='font-normal'>{attemptsCount}</span>
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

        {/* Action Buttons Section */}
        <div className='w-full pb-4'>
          {/* Initial State: Check Answer Button */}
          {state.showCheckIfAnswerIsCorrectButton && (
            <div className='flex w-full items-center justify-between'>
              {/* Remaining correct answers indicator */}
              {remainingCorrectToSelect > 0 ? (
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
              <CheckAnswerButton
                disabled={
                  selectedOptionsUuids === null ||
                  selectedOptionsUuids.length !== remainingCorrectToSelect
                }
                onClick={() => checkAnswer()}
              />
            </div>
          )}

          {/* Success State: Correct Answer Feedback */}
          {state.showContinueButton && (
            <RenderFeedback
              color='success'
              icon={<PartyPopper />}
              label={state.hasRevealedCorrectAnswer ? 'Answer Revealed' : 'Correct!'}
              score={score}
              hasBeenPlayed={payload?.is_complete}
              actions={
                <div className='flex'>
                  {/* Continue/Next Button */}
                  <div>
                    {!payload?.is_complete && (
                      <BlockActionButton
                        onClick={handleContinue}
                        loading={loading}
                        isLastBlock={isLastBlock}
                        disabled={mode === 'preview'}
                      />
                    )}
                  </div>
                  {/* Optional Explanation Button */}
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

          {/* Error State: Wrong Answer Feedback */}
          {state.showTryAgainButton && (
            <RenderFeedback
              color='destructive'
              icon={<XCircle />}
              label='Incorrect!'
              hasBeenPlayed={payload?.is_complete}
              actions={
                <div className='flex items-center space-x-4'>
                  {/* Retry Button */}
                  <TryAgainButton onClick={tryAgain} />
                  {/* Show Answer Button (appears after wrong attempt) */}
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

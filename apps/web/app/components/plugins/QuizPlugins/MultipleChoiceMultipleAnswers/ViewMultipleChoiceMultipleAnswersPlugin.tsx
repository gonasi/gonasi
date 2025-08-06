import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, PartyPopper, X, XCircle } from 'lucide-react';

import type { BlockInteractionSchemaTypes, BuilderSchemaTypes } from '@gonasi/schemas/plugins';

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

type MultipleChoiceMultiplePluginType = Extract<
  BuilderSchemaTypes,
  { plugin_type: 'multiple_choice_multiple' }
>;

type MultipleChoiceMultipleInteractionType = Extract<
  BlockInteractionSchemaTypes,
  { plugin_type: 'multiple_choice_multiple' }
>;

function isMultipleChoiceMultipleInteraction(
  data: unknown,
): data is MultipleChoiceMultipleInteractionType {
  return (
    typeof data === 'object' &&
    data !== null &&
    'plugin_type' in data &&
    (data as any).plugin_type === 'multiple_choice_multiple'
  );
}

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
export function ViewMultipleChoiceMultipleAnswersPlugin({
  blockWithProgress,
}: ViewPluginComponentProps) {
  const {
    settings: { playbackMode, layoutStyle, randomization, weight },
    content: { questionState, explanationState, hint, choices },
  } = blockWithProgress.block as MultipleChoiceMultiplePluginType;

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

  // Extract interaction data from DB - following the TrueOrFalse pattern
  const initialInteractionData: MultipleChoiceMultipleInteractionType | null = useMemo(() => {
    if (mode === 'preview') return null;

    // Get interaction data from the database via block progress
    const dbInteractionData = blockWithProgress.block_progress?.interaction_data;

    console.log('DB Interaction Data:', dbInteractionData); // Debug log

    return isMultipleChoiceMultipleInteraction(dbInteractionData) ? dbInteractionData : null;
  }, [blockWithProgress.block_progress?.interaction_data, mode]);

  // Also get the current selected option from payload if available
  const parsedPayloadData: MultipleChoiceMultipleInteractionType | null = useMemo(() => {
    const data = payload?.interaction_data;
    return isMultipleChoiceMultipleInteraction(data) ? data : null;
  }, [payload?.interaction_data]);

  // Use the most recent data (payload takes precedence over initial DB data)
  const currentInteractionData = parsedPayloadData || initialInteractionData;

  // Extract correct answers from choices
  const correctAnswers = useMemo(() => {
    return choices.filter((choice) => choice.isCorrect).map((choice) => choice.id);
  }, [choices]);

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
    currentInteractionData,
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

  // Update interaction data when state changes - following TrueOrFalse pattern
  useEffect(() => {
    if (mode === 'play') {
      console.log('Updating interaction data:', state); // Debug log
      updateInteractionData({ ...state });
    }
  }, [mode, state, updateInteractionData]);

  useEffect(() => {
    if (mode === 'play') {
      console.log('Updating earned score:', score); // Debug log
      updateEarnedScore(score);
    }
  }, [mode, score, updateEarnedScore]);

  useEffect(() => {
    if (mode === 'play') {
      console.log('Updating attempts count:', attemptsCount); // Debug log
      updateAttemptsCount(attemptsCount);
    }
  }, [mode, attemptsCount, updateAttemptsCount]);

  // Debug log for component state
  useEffect(() => {
    console.log('ViewMultipleChoiceMultipleAnswersPlugin State:', {
      mode,
      isCompleted,
      blockProgress: blockWithProgress.block_progress,
      state,
      selectedOptionsUuids,
      score,
      attemptsCount,
    });
  }, [
    mode,
    isCompleted,
    blockWithProgress.block_progress,
    state,
    selectedOptionsUuids,
    score,
    attemptsCount,
  ]);

  return (
    <ViewPluginWrapper
      isComplete={mode === 'preview' ? isCompleted : blockWithProgress.block_progress?.is_completed}
      playbackMode={playbackMode}
      mode={mode}
      reset={reset}
      weight={weight}
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
            const optionId = option.id;

            // Determine option state for styling and behavior
            const isSelected = selectedOptionsUuids?.includes(optionId) ?? false;

            // Check if this option was the correct answer in a previous attempt
            const isCorrectAttempt =
              !!state.correctAttempt && state.correctAttempt.selected.includes(optionId);

            // Check if this option was selected incorrectly in a previous attempt
            const isWrongAttempt = !!state.wrongAttempts?.some((attempt) =>
              attempt.selected.includes(optionId),
            );

            // Disable interaction for completed attempts, wrong attempts, or when interaction is locked
            const isDisabled =
              !canInteract ||
              isWrongAttempt ||
              isCorrectAttempt ||
              (!canSelectMore && !isSelected) ||
              lockSelectionsUntilTryAgain;

            return (
              <div key={optionId} className='relative w-full'>
                {/* Option Button */}
                <ChoiceOptionButton
                  choiceState={option.content}
                  isSelected={isSelected}
                  isDisabled={isDisabled}
                  onClick={() => selectOption(optionId)}
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
              {(() => {
                const selectedCount = selectedOptionsUuids?.length ?? 0;
                const remainingToSelect = remainingCorrectToSelect - selectedCount;
                const shouldShowReminder =
                  remainingCorrectToSelect > 0 && selectedCount !== remainingCorrectToSelect;

                return (
                  <AnimatePresence mode='wait'>
                    {shouldShowReminder && (
                      <motion.div
                        key='reminder-box'
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className='font-secondary bg-success/50 flex w-fit items-center space-x-1 rounded-md px-2 py-1 text-xs'
                      >
                        <span>Select</span>
                        <AnimatePresence mode='wait' initial={false}>
                          <motion.span
                            key={remainingToSelect}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.2 }}
                            className='font-primary bg-success/50 rounded-sm px-1'
                          >
                            {remainingToSelect}
                          </motion.span>
                        </AnimatePresence>
                        <span>more</span>
                        <span>choice{remainingToSelect !== 1 ? 's' : ''}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                );
              })()}

              <CheckAnswerButton
                disabled={
                  selectedOptionsUuids === null ||
                  selectedOptionsUuids.length !== remainingCorrectToSelect
                }
                onClick={checkAnswer}
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
              hasBeenPlayed={blockWithProgress.block_progress?.is_completed}
              actions={
                <div className='flex'>
                  {/* Continue/Next Button */}
                  {!blockWithProgress.block_progress?.is_completed && (
                    <BlockActionButton
                      onClick={handleContinue}
                      loading={loading}
                      isLastBlock={is_last_block}
                      disabled={mode === 'preview'}
                    />
                  )}

                  {/* Optional Explanation Button */}
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

          {/* Error State: Wrong Answer Feedback */}
          {state.showTryAgainButton && (
            <RenderFeedback
              color='destructive'
              icon={<XCircle />}
              label='Incorrect!'
              hasBeenPlayed={blockWithProgress.block_progress?.is_completed}
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

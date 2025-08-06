import { useEffect, useMemo } from 'react';
import { Check, PartyPopper, X, XCircle } from 'lucide-react';

import type { BlockInteractionSchemaTypes, BuilderSchemaTypes } from '@gonasi/schemas/plugins';

import { useMultipleChoiceSingleAnswerInteraction } from './hooks/useMultipleChoiceSingleAnswerInteraction';
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

type MultipleChoiceSinglePluginType = Extract<
  BuilderSchemaTypes,
  { plugin_type: 'multiple_choice_single' }
>;

type MultipleChoiceSingleInteractionType = Extract<
  BlockInteractionSchemaTypes,
  { plugin_type: 'multiple_choice_single' }
>;

function isMultipleChoiceSingleInteraction(
  data: unknown,
): data is MultipleChoiceSingleInteractionType {
  return (
    typeof data === 'object' &&
    data !== null &&
    'plugin_type' in data &&
    (data as any).plugin_type === 'multiple_choice_single'
  );
}

export function ViewMultipleChoiceSingleAnswerPlugin({
  blockWithProgress,
}: ViewPluginComponentProps) {
  const {
    settings: { playbackMode, layoutStyle, randomization, weight },
    content: { questionState, explanationState, hint, choices },
  } = blockWithProgress.block as MultipleChoiceSinglePluginType;

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
  const initialInteractionData: MultipleChoiceSingleInteractionType | null = useMemo(() => {
    if (mode === 'preview') return null;

    // Get interaction data from the database via block progress
    const dbInteractionData = blockWithProgress.block_progress?.interaction_data;

    console.log('DB Interaction Data:', dbInteractionData); // Debug log

    return isMultipleChoiceSingleInteraction(dbInteractionData) ? dbInteractionData : null;
  }, [blockWithProgress.block_progress?.interaction_data, mode]);

  // Also get the current selected option from payload if available
  const parsedPayloadData: MultipleChoiceSingleInteractionType | null = useMemo(() => {
    const data = payload?.interaction_data;
    return isMultipleChoiceSingleInteraction(data) ? data : null;
  }, [payload?.interaction_data]);

  // Use the most recent data (payload takes precedence over initial DB data)
  const currentInteractionData = parsedPayloadData || initialInteractionData;
  const correctChoiceId = choices.find((choice) => choice.isCorrect)?.id ?? '';

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
  } = useMultipleChoiceSingleAnswerInteraction(currentInteractionData, correctChoiceId);

  // Prepare answer options (shuffle if randomization is enabled)
  const answerOptions = useMemo(() => {
    return randomization === 'shuffle' ? shuffleArray(choices) : choices;
  }, [choices, randomization]);

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
    console.log('ViewMultipleChoiceSingleAnswerPlugin State:', {
      mode,
      isCompleted,
      blockProgress: blockWithProgress.block_progress,
      state,
      selectedOption,
      score,
      attemptsCount,
    });
  }, [
    mode,
    isCompleted,
    blockWithProgress.block_progress,
    state,
    selectedOption,
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
            // Use the option ID as the value instead of converting to boolean
            const optionValue = option.id;

            // Determine option state for styling and behavior
            const isSelected = selectedOption === optionValue;

            // Check if this option was the correct answer in a previous attempt
            const isCorrectAttempt =
              state.correctAttempt?.selected === optionValue && !state.correctAttempt?.wasRevealed;

            // Check if this option was revealed as correct
            const isRevealedCorrect =
              state.correctAttempt?.selected === optionValue && state.correctAttempt?.wasRevealed;

            // Check if this option was selected incorrectly in a previous attempt
            const isWrongAttempt = state.wrongAttempts.some(
              (attempt) => attempt.selected === optionValue,
            );

            // Disable interaction for completed attempts or when interaction is locked
            const isDisabled =
              !canInteract || isWrongAttempt || isCorrectAttempt || isRevealedCorrect;

            return (
              <div key={option.id} className='relative w-full'>
                {/* Option Button */}
                <ChoiceOptionButton
                  choiceState={option.content}
                  isSelected={isSelected}
                  isDisabled={isDisabled}
                  onClick={() => selectOption(optionValue)}
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
                  {/* Muted checkmark for revealed correct answers */}
                  {isRevealedCorrect && (
                    <Check
                      size={14}
                      className='text-muted-foreground bg-muted rounded-full p-0.5'
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

        {/* Attempt Counter */}
        <div className='text-muted-foreground font-secondary pb-1 text-xs'>
          Attempts: <span className='font-normal'>{attemptsCount}</span>
        </div>

        {/* Action Buttons Section */}
        <div className='w-full pb-4'>
          {/* Initial State: Check Answer Button */}
          {state.showCheckIfAnswerIsCorrectButton && (
            <CheckAnswerButton disabled={selectedOption === null} onClick={checkAnswer} />
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

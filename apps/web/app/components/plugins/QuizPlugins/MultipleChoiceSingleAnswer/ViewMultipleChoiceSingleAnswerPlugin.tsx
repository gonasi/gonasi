import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router';
import { Check, PartyPopper, X, XCircle } from 'lucide-react';

import type {
  MultipleChoiceSingleAnswerContentSchemaType,
  MultipleChoiceSingleAnswerInteractionSchemaType,
  MultipleChoiceSingleAnswerSettingsSchemaType,
} from '@gonasi/schemas/plugins';

import { useMultipleChoiceSingleAnswerInteraction } from './hooks/useMultipleChoiceSingleAnswerInteraction';
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
  ChoiceOptionButton,
  OutlineButton,
  ShowAnswerButton,
  TryAgainButton,
} from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { useStore } from '~/store/index.tsx';

/**
 * ViewMultipleChoiceSingleAnswerPlugin - Renders a multiple choice quiz interaction
 *
 * Features:
 * - Single answer selection from multiple options
 * - Answer validation with feedback
 * - Retry mechanism after wrong answers
 * - Score tracking and attempt counting
 * - Optional answer shuffling
 * - Rich text support for questions and answers
 */
export function ViewMultipleChoiceSingleAnswerPlugin({ block, mode }: ViewPluginComponentProps) {
  const params = useParams();

  // Extract configuration from block settings
  const { playbackMode, layoutStyle, randomization } =
    block.settings as MultipleChoiceSingleAnswerSettingsSchemaType;

  // Extract content data from block
  const { questionState, correctAnswer, explanationState, hint, choices } =
    block.content as MultipleChoiceSingleAnswerContentSchemaType;

  // Global app state for explanations and navigation
  const { isExplanationBottomSheetOpen, setExplanationState, isLastBlock } = useStore();

  // Core plugin functionality - handles data persistence and navigation
  const { loading, payload, handleContinue, updatePayload } = useViewPluginCore(
    mode === 'play' ? block.id : null,
  );

  // Multiple choice interaction state management
  const {
    state, // Full interaction state (attempts, UI flags, etc.)
    selectedOptionUuid, // Currently selected option ID
    selectOption, // Function to select/deselect options
    checkAnswer, // Function to validate the selected answer
    revealCorrectAnswer, // Function to show the correct answer
    isCompleted, // Whether interaction is finished
    tryAgain, // Function to retry after wrong answer
    canInteract, // Whether user can currently interact
    score, // Calculated score based on attempts
    reset, // Function to reset the entire interaction
  } = useMultipleChoiceSingleAnswerInteraction(
    payload?.state as MultipleChoiceSingleAnswerInteractionSchemaType,
    correctAnswer,
    choices.length,
  );

  // Calculate total attempts made (for display purposes)
  const attemptsCount = state.wrongAttempts.length + (state.correctAttempt ? 1 : 0);

  // Prepare answer options (shuffle if randomization is enabled)
  const answerOptions = useMemo(() => {
    return randomization === 'shuffle' ? shuffleArray(choices) : choices;
  }, [choices, randomization]);

  // Sync interaction state with backend when in play mode
  useEffect(() => {
    if (mode === 'play' && updatePayload) {
      updatePayload({
        plugin_type: 'multiple_choice_single',
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
            // Determine option state for styling and behavior
            const isSelected = selectedOptionUuid === option.uuid;

            // Check if this option was the correct answer in a previous attempt
            const isCorrectAttempt =
              !!state.correctAttempt && state.correctAttempt.selected === option.uuid;

            // Check if this option was selected incorrectly in a previous attempt
            const isWrongAttempt = !!state.wrongAttempts?.some(
              (attempt) => attempt.selected === option.uuid,
            );

            // Disable interaction for completed attempts or when interaction is locked
            const isDisabled = !canInteract || isWrongAttempt || isCorrectAttempt;

            return (
              <div key={option.uuid} className='relative w-full'>
                {/* Option Button */}
                <ChoiceOptionButton
                  choiceState={option.choiceState}
                  isSelected={isSelected}
                  isDisabled={isDisabled}
                  onClick={() => selectOption(option.uuid)}
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

        {/* Attempt Counter */}
        <div className='text-muted-foreground font-secondary pb-1 text-xs'>
          Attempts: <span className='font-normal'>{attemptsCount}</span>
        </div>

        {/* Action Buttons Section */}
        <div className='w-full pb-4'>
          {/* Initial State: Check Answer Button */}
          {state.showCheckIfAnswerIsCorrectButton && (
            <CheckAnswerButton disabled={selectedOptionUuid === null} onClick={checkAnswer} />
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

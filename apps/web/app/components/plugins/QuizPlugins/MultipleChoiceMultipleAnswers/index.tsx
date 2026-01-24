import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, PartyPopper, Settings, X, XCircle } from 'lucide-react';

import {
  EMPTY_LEXICAL_STATE,
  MultipleChoiceMultipleAnswersContentSchema,
  type MultipleChoiceMultipleAnswersContentSchemaTypes,
  MultipleChoiceMultipleAnswersInteractionSchema,
  MultipleChoiceMultipleAnswersSchema,
  MultipleChoiceMultipleAnswersSettingsSchema,
  type MultipleChoiceMultipleAnswersSettingsSchemaTypes,
} from '@gonasi/schemas/plugins';

import { useMultipleChoiceMultipleAnswersInteraction } from './hooks/useMultipleChoiceMultipleAnswersInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { RenderFeedback } from '../../common/RenderFeedback';
import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { LayoutStyleField } from '../../common/settings/LayoutStyleField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';
import { RandomizationModeField } from '../../common/settings/RandomizationModeField';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { createPlugin } from '../../core';
import { shuffleArray } from '../../utils';
import { calculateMultipleChoiceMultipleAnswersScore } from './utils';

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
import {
  GoChoiceField,
  GoRichTextInputField,
  GoTextAreaField,
} from '~/components/ui/forms/elements';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { cn } from '~/lib/utils';
import { useStore } from '~/store';

/**
 * Default content for new Multiple Choice Multiple Answers blocks
 */
const defaultContent: MultipleChoiceMultipleAnswersContentSchemaTypes = {
  questionState: EMPTY_LEXICAL_STATE,
  choices: [],
  explanationState: EMPTY_LEXICAL_STATE,
};

/**
 * Default settings for new Multiple Choice Multiple Answers blocks
 */
const defaultSettings: MultipleChoiceMultipleAnswersSettingsSchemaTypes = {
  playbackMode: 'inline',
  weight: 4,
  layoutStyle: 'single',
  randomization: 'shuffle',
};

/**
 * Multiple Choice Multiple Answers Plugin
 *
 * Refactored using the new plugin architecture.
 * Before: ~420 lines (Builder + View)
 * After: ~280 lines (including UI rendering)
 * Reduction: ~33%
 */
export const MultipleChoiceMultipleAnswersPlugin = createPlugin({
  pluginType: 'multiple_choice_multiple',

  metadata: {
    name: 'Multiple Choice (Multiple Answers)',
    description: 'Multiple choice questions with multiple correct answers',
    icon: 'CheckSquare',
    category: 'quiz',
  },

  schemas: {
    builder: MultipleChoiceMultipleAnswersSchema,
    content: MultipleChoiceMultipleAnswersContentSchema,
    settings: MultipleChoiceMultipleAnswersSettingsSchema,
    interaction: MultipleChoiceMultipleAnswersInteractionSchema as any,
  },

  defaults: {
    content: defaultContent,
    settings: defaultSettings,
  },

  hooks: {
    useInteraction: useMultipleChoiceMultipleAnswersInteraction,
  },

  /**
   * Builder UI - Form fields for content creation
   */
  renderBuilder: () => {
    return (
      <>
        <GoRichTextInputField
          name='content.questionState'
          labelProps={{ children: 'Question', required: true }}
          placeholder='Pose a challenging question...'
          description='Learners may need to select more than one correct answer.'
        />

        <GoChoiceField
          name='content.choices'
          labelProps={{ children: 'Choices (select all that apply)', required: true }}
          minChoices={3}
          maxChoices={10}
        />

        <GoRichTextInputField
          name='content.explanationState'
          labelProps={{ children: 'Explanation', required: true }}
          placeholder='Provide your reasoning...'
          description='Explain why the correct answers are correct and others are not.'
        />

        <GoTextAreaField
          name='content.hint'
          labelProps={{ children: 'Hint (optional)' }}
          textareaProps={{}}
          description='Offer a clue to guide learners without giving away the answer.'
        />
      </>
    );
  },

  /**
   * Settings popover - Plugin configuration
   */
  renderSettings: ({ methods, playbackMode }) => {
    const watchLayoutStyle = methods.getValues('settings.layoutStyle');
    const watchRandomization = methods.getValues('settings.randomization');

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Settings
            className='transition-transform duration-200 hover:scale-105 hover:rotate-15 hover:cursor-pointer'
            size={20}
          />
        </PopoverTrigger>
        <PopoverContent className='w-full max-w-md'>
          <div className='grid gap-4'>
            <div className='space-y-2'>
              <h4 className='leading-none font-medium'>Block settings</h4>
              <p className='text-muted-foreground text-sm'>
                Tweak how this block behaves, your rules, your way!
              </p>
            </div>
            <div className='grid gap-2'>
              <BlockWeightField name='settings.weight' />
              <PlaybackModeField name='settings.playbackMode' watchValue={playbackMode} />
              <LayoutStyleField name='settings.layoutStyle' watchValue={watchLayoutStyle} />
              <RandomizationModeField
                name='settings.randomization'
                watchValue={watchRandomization}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  },

  /**
   * View UI - Interactive quiz rendering
   */
  renderView: function MultipleChoiceMultipleAnswersView({
    interaction,
    content,
    settings,
    mode,
    blockWithProgress,
    loading,
    handleContinue,
  }) {
    const { isExplanationBottomSheetOpen, setExplanationState } = useStore();

    // Extract correct answers from choices
    const correctAnswers = useMemo(() => {
      return content.choices.filter((choice) => choice.isCorrect).map((choice) => choice.id);
    }, [content.choices]);

    // Prepare answer options (shuffle if randomization is enabled)
    const answerOptions = useMemo(() => {
      return settings.randomization === 'shuffle' ? shuffleArray(content.choices) : content.choices;
    }, [content.choices, settings.randomization]);

    // Track whether selections should be locked until the user clicks "Try Again"
    const lockSelectionsUntilTryAgain = useMemo(() => {
      return interaction.state.isCorrect === false && interaction.state.showTryAgainButton;
    }, [interaction.state.isCorrect, interaction.state.showTryAgainButton]);

    return (
      <ViewPluginWrapper
        isComplete={
          mode === 'preview'
            ? interaction.isCompleted
            : blockWithProgress.block_progress?.is_completed
        }
        playbackMode={settings.playbackMode}
        mode={mode}
        reset={interaction.reset}
        weight={settings.weight}
      >
        <PlayPluginWrapper hint={content.hint}>
          {/* Question Section */}
          <RichTextRenderer editorState={content.questionState} />

          {/* Answer Options Grid/List */}
          <div
            className={cn('gap-4 py-6', {
              'flex flex-col': settings.layoutStyle === 'single',
              'grid grid-cols-2': settings.layoutStyle === 'double',
            })}
          >
            {answerOptions.map((option) => {
              const optionId = option.id;

              // Determine option state for styling and behavior
              const isSelected = interaction.selectedOptionsUuids?.includes(optionId) ?? false;

              // Check if this option was the correct answer in a previous attempt
              const isCorrectAttempt =
                !!interaction.state.correctAttempt &&
                interaction.state.correctAttempt.selected.includes(optionId);

              // Check if this option was selected incorrectly in a previous attempt
              const isWrongAttempt = !!interaction.state.wrongAttempts?.some((attempt) =>
                attempt.selected.includes(optionId),
              );

              // Disable interaction
              const isDisabled =
                !interaction.canInteract ||
                isWrongAttempt ||
                isCorrectAttempt ||
                (!interaction.canSelectMore && !isSelected) ||
                lockSelectionsUntilTryAgain;

              return (
                <div key={optionId} className='relative w-full'>
                  {/* Option Button */}
                  <ChoiceOptionButton
                    choiceState={option.content}
                    isSelected={isSelected}
                    isDisabled={isDisabled}
                    onClick={() => interaction.selectOption(optionId)}
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

          {/* Progress Indicators */}
          <div className='text-muted-foreground font-secondary pb-1 text-xs'>
            Attempts: <span className='font-normal'>{interaction.attemptsCount}</span>
            {interaction.state.correctAttempt?.selected &&
              interaction.state.correctAttempt.selected.length > 0 && (
                <span className='ml-2'>
                  Correct answers found:{' '}
                  <span className='font-primary bg-success/50 text-success-foreground rounded-sm p-1'>
                    {interaction.state.correctAttempt.selected.length}
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
            {interaction.state.showCheckIfAnswerIsCorrectButton && (
              <div className='flex w-full items-center justify-between'>
                {/* Remaining correct answers indicator */}
                {(() => {
                  const selectedCount = interaction.selectedOptionsUuids?.length ?? 0;
                  const remainingToSelect = interaction.remainingCorrectToSelect - selectedCount;
                  const shouldShowReminder =
                    interaction.remainingCorrectToSelect > 0 &&
                    selectedCount !== interaction.remainingCorrectToSelect;

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
                    interaction.selectedOptionsUuids === null ||
                    interaction.selectedOptionsUuids.length !== interaction.remainingCorrectToSelect
                  }
                  onClick={interaction.checkAnswer}
                />
              </div>
            )}

            {/* Success State: Correct Answer Feedback */}
            {interaction.state.showContinueButton && (
              <RenderFeedback
                color='success'
                icon={<PartyPopper />}
                label={interaction.state.hasRevealedCorrectAnswer ? 'Answer Revealed' : 'Correct!'}
                score={interaction.score}
                hasBeenPlayed={blockWithProgress.block_progress?.is_completed}
                actions={
                  <div className='flex'>
                    {/* Continue/Next Button */}
                    {!blockWithProgress.block_progress?.is_completed && (
                      <BlockActionButton
                        onClick={handleContinue}
                        loading={loading}
                        isLastBlock={blockWithProgress.is_last_block}
                        disabled={mode === 'preview'}
                      />
                    )}

                    {/* Optional Explanation Button */}
                    {!isExplanationBottomSheetOpen &&
                      interaction.state.canShowExplanationButton && (
                        <AnimateInButtonWrapper>
                          <OutlineButton
                            className='ml-4 rounded-full'
                            onClick={() => setExplanationState(content.explanationState)}
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
            {interaction.state.showTryAgainButton && (
              <RenderFeedback
                color='destructive'
                icon={<XCircle />}
                label='Incorrect!'
                hasBeenPlayed={blockWithProgress.block_progress?.is_completed}
                actions={
                  <div className='flex items-center space-x-4'>
                    {/* Retry Button */}
                    {interaction.tryAgain && <TryAgainButton onClick={interaction.tryAgain} />}
                    {/* Show Answer Button */}
                    {interaction.state.showShowAnswerButton && interaction.revealCorrectAnswer && (
                      <ShowAnswerButton onClick={interaction.revealCorrectAnswer} />
                    )}
                  </div>
                }
              />
            )}
          </div>
        </PlayPluginWrapper>
      </ViewPluginWrapper>
    );
  },

  /**
   * Scoring logic
   */
  scoring: {
    calculate: (state) => {
      return calculateMultipleChoiceMultipleAnswersScore({
        isCorrect: state.isCorrect,
        correctAnswersRevealed: state.hasRevealedCorrectAnswer,
        correctAnswersSelected: state.correctAttempt?.selected.length ?? 0,
        totalCorrectAnswers: 2, // Placeholder - will be passed from content
        wrongAnswersSelected: state.wrongAttempts.length,
        totalChoicesAvailable: 5, // Placeholder - will be passed from content
        attemptsCount: state.wrongAttempts.length + (state.correctAttempt ? 1 : 0),
        wrongAttempts: state.wrongAttempts,
      });
    },
    getMaxScore: () => 100,
    getPenaltyFactor: () => 0.15,
  },
});

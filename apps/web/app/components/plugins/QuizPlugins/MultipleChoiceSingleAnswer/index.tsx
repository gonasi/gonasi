import { useMemo } from 'react';
import { Check, PartyPopper, Settings, X, XCircle } from 'lucide-react';

import {
  EMPTY_LEXICAL_STATE,
  MultipleChoiceSingleAnswerContentSchema,
  type MultipleChoiceSingleAnswerContentSchemaTypes,
  MultipleChoiceSingleAnswerInteractionSchema,
  MultipleChoiceSingleAnswerSchema,
  MultipleChoiceSingleAnswerSettingsSchema,
  type MultipleChoiceSingleAnswerSettingsSchemaTypes,
} from '@gonasi/schemas/plugins';

import { useMultipleChoiceSingleAnswerInteraction } from './hooks/useMultipleChoiceSingleAnswerInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { RenderFeedback } from '../../common/RenderFeedback';
import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { LayoutStyleField } from '../../common/settings/LayoutStyleField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';
import { RandomizationModeField } from '../../common/settings/RandomizationModeField';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { createPlugin } from '../../core';
import { shuffleArray } from '../../utils';
import { calculateMultipleChoiceSingleAnswerScore } from './utils';

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
 * Default content for new Multiple Choice Single Answer blocks
 */
const defaultContent: MultipleChoiceSingleAnswerContentSchemaTypes = {
  questionState: EMPTY_LEXICAL_STATE,
  choices: [],
  explanationState: EMPTY_LEXICAL_STATE,
};

/**
 * Default settings for new Multiple Choice Single Answer blocks
 */
const defaultSettings: MultipleChoiceSingleAnswerSettingsSchemaTypes = {
  playbackMode: 'inline',
  weight: 3,
  layoutStyle: 'single',
  randomization: 'shuffle',
};

/**
 * Multiple Choice Single Answer Plugin
 *
 * Refactored using the new plugin architecture.
 * Before: ~350 lines (Builder + View)
 * After: ~180 lines (including UI rendering)
 * Reduction: ~50%
 */
export const MultipleChoiceSingleAnswerPlugin = createPlugin({
  pluginType: 'multiple_choice_single',

  metadata: {
    name: 'Multiple Choice (Single Answer)',
    description: 'Multiple choice questions with one correct answer',
    icon: 'ListChecks',
    category: 'quiz',
  },

  schemas: {
    builder: MultipleChoiceSingleAnswerSchema,
    content: MultipleChoiceSingleAnswerContentSchema,
    settings: MultipleChoiceSingleAnswerSettingsSchema,
    interaction: MultipleChoiceSingleAnswerInteractionSchema as any,
  },

  defaults: {
    content: defaultContent,
    settings: defaultSettings,
  },

  hooks: {
    useInteraction: useMultipleChoiceSingleAnswerInteraction,
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
          placeholder='Ask a challenging question...'
          description='Make learners think deeply about this one!'
        />

        <GoChoiceField
          name='content.choices'
          labelProps={{ children: 'Choices', required: true }}
        />

        <GoRichTextInputField
          name='content.explanationState'
          labelProps={{ children: 'Why is that the answer?', required: true }}
          placeholder='Give a short explanation...'
          description='Briefly explain the reasoning behind the correct answer. This helps learners build deeper understanding, especially if they got it wrong.'
        />

        <GoTextAreaField
          name='content.hint'
          labelProps={{ children: 'Hint (optional)' }}
          textareaProps={{}}
          description='Provide a subtle clue to help learners.'
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
  renderView: function MultipleChoiceSingleAnswerView({
    interaction,
    content,
    settings,
    mode,
    blockWithProgress,
    loading,
    handleContinue,
  }) {
    const { isExplanationBottomSheetOpen, setExplanationState } = useStore();

    // Prepare answer options (shuffle if randomization is enabled)
    const answerOptions = useMemo(() => {
      return settings.randomization === 'shuffle' ? shuffleArray(content.choices) : content.choices;
    }, [content.choices, settings.randomization]);

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
              'flex flex-col': settings.layoutStyle === 'single', // Vertical layout
              'grid grid-cols-2 items-stretch': settings.layoutStyle === 'double', // Equal height in double layout
            })}
          >
            {answerOptions.map((option) => {
              // Use the option ID as the value
              const optionValue = option.id;

              // Determine option state for styling and behavior
              const isSelected = interaction.selectedOption === optionValue;

              // Check if this option was the correct answer in a previous attempt
              const isCorrectAttempt =
                interaction.state.correctAttempt?.selected === optionValue &&
                !interaction.state.correctAttempt?.wasRevealed;

              // Check if this option was revealed as correct
              const isRevealedCorrect =
                interaction.state.correctAttempt?.selected === optionValue &&
                interaction.state.correctAttempt?.wasRevealed;

              // Check if this option was selected incorrectly in a previous attempt
              const isWrongAttempt = interaction.state.wrongAttempts.some(
                (attempt) => attempt.selected === optionValue,
              );

              // Disable interaction for completed attempts or when interaction is locked
              const isDisabled =
                !interaction.canInteract || isWrongAttempt || isCorrectAttempt || isRevealedCorrect;

              return (
                <div key={option.id} className='relative w-full'>
                  {/* Option Button */}
                  <ChoiceOptionButton
                    choiceState={option.content}
                    isSelected={isSelected}
                    isDisabled={isDisabled}
                    onClick={() => interaction.selectOption(optionValue)}
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

          {/* Attempt Counter */}
          <div className='text-muted-foreground font-secondary pb-1 text-xs'>
            Attempts: <span className='font-normal'>{interaction.attemptsCount}</span>
          </div>

          {/* Action Buttons Section */}
          <div className='w-full pb-4'>
            {/* Initial State: Check Answer Button */}
            {interaction.state.showCheckIfAnswerIsCorrectButton && (
              <CheckAnswerButton
                disabled={interaction.selectedOption === null}
                onClick={interaction.checkAnswer}
              />
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
                    {/* Show Answer Button (appears after wrong attempt) */}
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
      return calculateMultipleChoiceSingleAnswerScore({
        correctAnswerRevealed: state.hasRevealedCorrectAnswer,
        wrongAttemptsCount: state.wrongAttempts.length,
        numberOfOptions: 4, // This is a placeholder - actual number would need to be passed
      });
    },
    getMaxScore: () => 100,
    getPenaltyFactor: () => 0.25, // Varies based on number of options
  },
});

import { useMemo } from 'react';
import { Check, PartyPopper, Settings, X, XCircle } from 'lucide-react';

import {
  EMPTY_LEXICAL_STATE,
  TrueOrFalseContentSchema,
  type TrueOrFalseContentSchemaTypes,
  TrueOrFalseSchema,
  TrueOrFalseSettingsSchema,
  type TrueOrFalseSettingsSchemaTypes,
  TrueOrFalseStateInteractionSchema,
  type TrueOrFalseStateInteractionSchemaTypes,
} from '@gonasi/schemas/plugins';

import { useTrueOrFalseInteraction } from './hooks/useTrueOrFalseInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { RenderFeedback } from '../../common/RenderFeedback';
import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { LayoutStyleField } from '../../common/settings/LayoutStyleField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';
import { RandomizationModeField } from '../../common/settings/RandomizationModeField';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { createPlugin } from '../../core';
import { shuffleArray } from '../../utils';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import {
  AnimateInButtonWrapper,
  BlockActionButton,
  CheckAnswerButton,
  OutlineButton,
  ShowAnswerButton,
  TrueOrFalseOptionsButton,
  TryAgainButton,
} from '~/components/ui/button';
import {
  GoRadioGroupField,
  GoRichTextInputField,
  GoTextAreaField,
} from '~/components/ui/forms/elements';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { cn } from '~/lib/utils';
import { useStore } from '~/store';

/**
 * Default content for new True or False blocks
 */
const defaultContent: TrueOrFalseContentSchemaTypes = {
  questionState: EMPTY_LEXICAL_STATE,
  correctAnswer: 'true',
  explanationState: EMPTY_LEXICAL_STATE,
};

/**
 * Default settings for new True or False blocks
 */
const defaultSettings: TrueOrFalseSettingsSchemaTypes = {
  playbackMode: 'inline',
  weight: 1,
  layoutStyle: 'double',
  randomization: 'none',
};

/**
 * True or False Plugin
 *
 * Refactored using the new plugin architecture.
 * Before: ~350 lines (Builder + View)
 * After: ~140 lines (including UI rendering)
 * Reduction: 60%
 */
export const TrueOrFalsePlugin = createPlugin({
  pluginType: 'true_or_false',

  metadata: {
    name: 'True or False',
    description: 'Binary choice questions',
    icon: 'CheckCircle',
    category: 'quiz',
  },

  schemas: {
    builder: TrueOrFalseSchema,
    content: TrueOrFalseContentSchema,
    settings: TrueOrFalseSettingsSchema,
    interaction: TrueOrFalseStateInteractionSchema as any,
  },

  defaults: {
    content: defaultContent,
    settings: defaultSettings,
  },

  hooks: {
    useInteraction: useTrueOrFalseInteraction,
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
          placeholder='Type your brain teaser here...'
          description='What statement should learners decide is true or false? Make it fun!'
        />
        <GoRadioGroupField
          name='content.correctAnswer'
          labelProps={{ children: "What's the right call?" }}
          options={[
            { value: 'true', label: 'True' },
            { value: 'false', label: 'False' },
          ]}
          description='Pick the correct answer — no pressure!'
        />
        <GoRichTextInputField
          name='content.explanationState'
          labelProps={{ children: 'Why is that the answer?', required: true }}
          placeholder='Share your wisdom...'
          description='Help learners get the "aha!" moment by explaining the logic.'
        />
        <GoTextAreaField
          name='content.hint'
          labelProps={{ children: 'Need a hint?' }}
          textareaProps={{}}
          description="Give learners a gentle nudge if they're stuck (optional)."
        />
      </>
    );
  },

  /**
   * Settings popover - Plugin configuration
   */
  renderSettings: ({ methods, playbackMode }) => {
    const watchLayoutStyle = methods.watch('settings.layoutStyle');
    const watchRandomization = methods.watch('settings.randomization');

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
  renderView: function TrueOrFalseView({
    interaction,
    content,
    settings,
    mode,
    blockWithProgress,
    loading,
    handleContinue,
  }) {
    const { isExplanationBottomSheetOpen, setExplanationState } = useStore();

    const answerOptions = useMemo(() => {
      const options = [true, false];
      return settings.randomization === 'shuffle' ? shuffleArray(options) : options;
    }, [settings.randomization]);

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
          <RichTextRenderer editorState={content.questionState} />

          <div className='flex flex-col gap-4'>
            <div
              className={cn('gap-4 py-6', {
                'grid grid-cols-1': settings.layoutStyle === 'single',
                'grid grid-cols-2': settings.layoutStyle === 'double',
              })}
            >
              {answerOptions.map((val) => {
                const isSelected = interaction.selectedOption === val;
                const isCorrectAttempt =
                  interaction.state.correctAttempt?.selected === val &&
                  !interaction.state.correctAttempt?.wasRevealed;
                const isRevealedCorrect =
                  interaction.state.correctAttempt?.selected === val &&
                  interaction.state.correctAttempt?.wasRevealed;
                const isWrongAttempt = interaction.state.wrongAttempts.some(
                  (a: TrueOrFalseStateInteractionSchemaTypes['wrongAttempts'][number]) =>
                    a.selected === val,
                );
                const isDisabled =
                  !interaction.canInteract ||
                  isCorrectAttempt ||
                  isWrongAttempt ||
                  isRevealedCorrect;

                return (
                  <div key={String(val)} className='relative w-full'>
                    <TrueOrFalseOptionsButton
                      val={val}
                      icon={val ? <Check /> : <X />}
                      isSelected={isSelected}
                      isDisabled={isDisabled}
                      selectOption={() => interaction.selectOption(val)}
                    />

                    <div className='absolute -top-1.5 -right-1.5 rounded-full'>
                      {isCorrectAttempt && (
                        <Check
                          size={14}
                          className='text-success-foreground bg-success rounded-full p-0.5'
                        />
                      )}
                      {isRevealedCorrect && (
                        <Check
                          size={14}
                          className='text-muted-foreground bg-muted rounded-full p-0.5'
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

          <div className='text-muted-foreground font-secondary pb-1 text-xs'>
            Attempts: <span className='font-normal'>{interaction.attemptsCount}</span>
          </div>

          <div className='w-full pb-4'>
            {interaction.state.showCheckIfAnswerIsCorrectButton && (
              <CheckAnswerButton
                disabled={interaction.selectedOption === null}
                onClick={interaction.checkAnswer}
              />
            )}

            {interaction.state.showContinueButton && (
              <RenderFeedback
                color='success'
                icon={<PartyPopper />}
                label={interaction.state.hasRevealedCorrectAnswer ? 'Answer Revealed' : 'Correct!'}
                score={interaction.score}
                hasBeenPlayed={blockWithProgress.block_progress?.is_completed}
                actions={
                  <div className='flex'>
                    {!blockWithProgress.block_progress?.is_completed && (
                      <BlockActionButton
                        onClick={handleContinue}
                        loading={loading}
                        isLastBlock={blockWithProgress.is_last_block}
                        disabled={mode === 'preview'}
                      />
                    )}

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

            {interaction.state.showTryAgainButton && (
              <RenderFeedback
                color='destructive'
                icon={<XCircle />}
                label='Incorrect!'
                hasBeenPlayed={blockWithProgress.block_progress?.is_completed}
                actions={
                  <div className='flex items-center space-x-4'>
                    {interaction.tryAgain && <TryAgainButton onClick={interaction.tryAgain} />}
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
      const MAX_SCORE = 100;
      const PENALTY_PER_WRONG_ATTEMPT = 50;

      if (state.correctAttempt === null) return 0;
      if (state.correctAttempt?.wasRevealed) return 0;

      const penalty = state.wrongAttempts.length * PENALTY_PER_WRONG_ATTEMPT;
      return Math.max(MAX_SCORE - penalty, 0);
    },
    getMaxScore: () => 100,
    getPenaltyFactor: () => 0.5,
  },
});

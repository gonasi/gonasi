import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Settings } from 'lucide-react';

import {
  EMPTY_LEXICAL_STATE,
  MatchingGameContentSchema,
  type MatchingGameContentSchemaTypes,
  MatchingGameInteractionSchema,
  MatchingGameSchema,
  MatchingGameSettingsSchema,
  type MatchingGameSettingsSchemaTypes,
} from '@gonasi/schemas/plugins';

import { MatchingItemButton } from './components/MatchingItemButton';
import { useMatchingGameInteraction } from './hooks/useMatchingGameInteraction';
import { getMatchColor } from './utils/colors';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { RenderFeedback } from '../../common/RenderFeedback';
import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { LayoutStyleField } from '../../common/settings/LayoutStyleField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';
import { RandomizationModeField } from '../../common/settings/RandomizationModeField';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { createPlugin } from '../../core';
import { shuffleArray } from '../../utils';
import { calculateMatchingGameScore } from './utils';

import optionTapSound from '/assets/sounds/options-button.wav';
import rightAnswerSound from '/assets/sounds/right-answer.mp3';
import wrongAnswerSound from '/assets/sounds/wrong-answer.mp3';
import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { BlockActionButton } from '~/components/ui/button';
import {
  GoMatchingPairField,
  GoRichTextInputField,
  GoTextAreaField,
} from '~/components/ui/forms/elements';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Progress } from '~/components/ui/progress';
import { useStore } from '~/store';

// Create Howl instances for sound effects
const rightAnswerHowl = new Howl({
  src: [rightAnswerSound],
  volume: 0.5,
  preload: true,
});

const wrongAnswerHowl = new Howl({
  src: [wrongAnswerSound],
  volume: 0.5,
  preload: true,
});

const tapHowl = new Howl({
  src: [optionTapSound],
  volume: 0.1,
  preload: true,
});

/**
 * Default content for new Matching Game blocks
 */
const defaultContent: MatchingGameContentSchemaTypes = {
  questionState: EMPTY_LEXICAL_STATE,
  pairs: [],
};

/**
 * Default settings for new Matching Game blocks
 */
const defaultSettings: MatchingGameSettingsSchemaTypes = {
  playbackMode: 'inline',
  weight: 5,
  layoutStyle: 'double',
  randomization: 'shuffle',
};

// Migration helper: Convert old pair format to new format
function migratePairToNewFormat(pair: any): any {
  if ('leftContentData' in pair && 'rightContentData' in pair) {
    return pair;
  }

  if ('leftContent' in pair && 'rightContent' in pair) {
    return {
      ...pair,
      leftContentData: {
        type: 'richtext',
        content: pair.leftContent,
      },
      rightContentData: {
        type: 'richtext',
        content: pair.rightContent,
      },
      leftContent: undefined,
      rightContent: undefined,
    };
  }

  return pair;
}

/**
 * Matching Game Plugin
 *
 * Refactored using the new plugin architecture.
 * Features bidirectional matching, color-coded pairs, sound effects, and asset support.
 *
 * Before: ~616 lines (Builder + View)
 * After: ~450 lines (including complex UI and animations)
 * Reduction: ~27%
 */
export const MatchingGamePlugin = createPlugin({
  pluginType: 'matching_game',

  metadata: {
    name: 'Matching Game',
    description: 'Match pairs of items with visual feedback and animations',
    icon: 'Cable',
    category: 'quiz',
  },

  schemas: {
    builder: MatchingGameSchema,
    content: MatchingGameContentSchema,
    settings: MatchingGameSettingsSchema,
    interaction: MatchingGameInteractionSchema as any,
  },

  defaults: {
    content: defaultContent,
    settings: defaultSettings,
  },

  hooks: {
    useInteraction: useMatchingGameInteraction,
  },

  /**
   * Content migration - convert old pair format to new format
   */
  migrations: {
    migrateContent: (oldContent: any) => {
      if (!oldContent.pairs) return oldContent;

      return {
        ...oldContent,
        pairs: oldContent.pairs.map(migratePairToNewFormat),
      };
    },
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
          placeholder='Enter your matching game question or instructions...'
          description='What should learners match? Make it clear and engaging!'
        />
        <GoMatchingPairField
          name='content.pairs'
          labelProps={{ children: 'Matching Pairs', required: true }}
          description='Add 2-10 matching pairs. Each pair consists of a left item and a right item that learners will match.'
          minPairs={2}
          maxPairs={10}
        />
        <GoTextAreaField
          name='content.hint'
          labelProps={{ children: 'Hint' }}
          textareaProps={{}}
          description='Optional hint that learners can reveal if they need help (10-100 characters).'
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
   * View UI - Interactive matching game
   */
  renderView: function MatchingGameView({
    interaction,
    content,
    settings,
    mode,
    blockWithProgress,
    loading,
    handleContinue,
  }) {
    const { isSoundEnabled, isVibrationEnabled } = useStore();

    // Track previous state to detect changes for sound effects and animations
    const prevMatchedCountRef = useRef(0);
    const prevWrongAttemptsCountRef = useRef(0);

    // Track items that should show nudge animation
    const [nudgeLeftId, setNudgeLeftId] = useState<string | null>(null);
    const [nudgeRightId, setNudgeRightId] = useState<string | null>(null);

    // Sort items by their indexes or shuffle if randomization is enabled
    const leftItems = useMemo(() => {
      const items = content.pairs.map((pair) => ({
        id: pair.id,
        contentData: pair.leftContentData,
        index: pair.leftIndex,
      }));
      if (settings.randomization === 'shuffle') {
        return shuffleArray(items);
      }
      return items.sort((a, b) => a.index - b.index);
    }, [content.pairs, settings.randomization]);

    const rightItems = useMemo(() => {
      const items = content.pairs.map((pair) => ({
        id: pair.id,
        contentData: pair.rightContentData,
        index: pair.rightIndex,
      }));
      if (settings.randomization === 'shuffle') {
        return shuffleArray(items);
      }
      return items.sort((a, b) => a.index - b.index);
    }, [content.pairs, settings.randomization]);

    // Get the match color for a specific item based on when it was matched
    const getItemMatchColor = useCallback(
      (itemId: string, isLeft: boolean) => {
        const matchIndex = interaction.state.matchedPairs.findIndex((match) =>
          isLeft ? match.leftId === itemId : match.rightId === itemId,
        );
        if (matchIndex === -1) return undefined;
        return getMatchColor(matchIndex);
      },
      [interaction.state.matchedPairs],
    );

    // Play sound effects, vibrate, and trigger nudge animations on match or wrong attempt
    useEffect(() => {
      const currentMatchedCount = interaction.state.matchedPairs.length;
      // Count wrong attempts from both directions
      const leftToRightWrong = interaction.state.wrongAttemptsPerLeftItem.reduce(
        (sum, entry) => sum + entry.wrongRightIds.length,
        0,
      );
      const rightToLeftWrong = interaction.state.wrongAttemptsPerRightItem.reduce(
        (sum, entry) => sum + entry.wrongLeftIds.length,
        0,
      );
      const currentWrongAttemptsCount = leftToRightWrong + rightToLeftWrong;

      // Correct match - play sound and trigger nudge animation
      if (currentMatchedCount > prevMatchedCountRef.current) {
        if (isSoundEnabled) {
          rightAnswerHowl.play();
        }

        // Get the most recent match to trigger nudge animation
        const latestMatch =
          interaction.state.matchedPairs[interaction.state.matchedPairs.length - 1];
        if (latestMatch) {
          setNudgeLeftId(latestMatch.leftId);
          setNudgeRightId(latestMatch.rightId);

          setTimeout(() => {
            setNudgeLeftId(null);
            setNudgeRightId(null);
          }, 600);
        }
      }

      // Wrong match - play sound, vibrate, and trigger nudge animation
      if (currentWrongAttemptsCount > prevWrongAttemptsCountRef.current) {
        if (isSoundEnabled) {
          wrongAnswerHowl.play();
        }
        if (isVibrationEnabled && 'vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }

        // Find the most recent wrong attempt to trigger nudge
        const latestWrongEntry = interaction.state.wrongAttemptsPerLeftItem
          .map((entry) => ({
            leftId: entry.leftId,
            rightId: entry.wrongRightIds[entry.wrongRightIds.length - 1],
          }))
          .filter((item) => item.rightId !== undefined)[0];

        if (latestWrongEntry?.rightId) {
          setNudgeLeftId(latestWrongEntry.leftId);
          setNudgeRightId(latestWrongEntry.rightId);

          setTimeout(() => {
            setNudgeLeftId(null);
            setNudgeRightId(null);
          }, 600);
        }
      }

      // Update refs
      prevMatchedCountRef.current = currentMatchedCount;
      prevWrongAttemptsCountRef.current = currentWrongAttemptsCount;
    }, [
      interaction.state.matchedPairs,
      interaction.state.wrongAttemptsPerLeftItem,
      interaction.state.wrongAttemptsPerRightItem,
      isSoundEnabled,
      isVibrationEnabled,
    ]);

    return (
      <ViewPluginWrapper
        isComplete={
          mode === 'preview'
            ? interaction.isCompleted
            : blockWithProgress.block_progress?.is_completed
        }
        playbackMode={settings.playbackMode}
        mode={mode}
        weight={settings.weight}
        reset={interaction.reset}
      >
        <PlayPluginWrapper hint={content.hint}>
          {/* Question */}
          <div className='mb-6'>
            <RichTextRenderer editorState={content.questionState} />
          </div>

          {/* Two-column layout for matching items */}
          <div className='grid grid-cols-2 gap-4 md:gap-6'>
            {/* Left column */}
            <div className='space-y-2 py-2'>
              <div className='text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase'>
                {interaction.state.selectedRightId ? 'Tap to match' : 'Tap to select'}
              </div>
              {leftItems.map((item) => (
                <MatchingItemButton
                  key={item.id}
                  contentData={item.contentData}
                  mode={mode}
                  isSelected={interaction.isLeftItemSelected(item.id)}
                  isMatched={interaction.isLeftItemMatched(item.id)}
                  isDisabled={!interaction.canInteract || interaction.isLeftItemDisabled(item.id)}
                  isWrong={interaction.isLeftItemWrong(item.id)}
                  matchColor={getItemMatchColor(item.id, true)}
                  shouldPulseSubtle={
                    interaction.state.selectedLeftId === null &&
                    interaction.state.selectedRightId === null &&
                    !interaction.isLeftItemMatched(item.id)
                  }
                  shouldPulse={
                    interaction.state.selectedRightId !== null &&
                    !interaction.isLeftItemMatched(item.id)
                  }
                  shouldNudge={item.id === nudgeLeftId}
                  onClick={() => {
                    const isDisabled =
                      !interaction.canInteract || interaction.isLeftItemDisabled(item.id);
                    if (!isDisabled && isSoundEnabled) {
                      tapHowl.play();
                    }
                    interaction.selectLeftItem(item.id);
                  }}
                />
              ))}
            </div>

            {/* Right column - with subtle background for distinction */}
            <div className='space-y-2 rounded-lg border p-2 shadow-lg'>
              <div className='text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase'>
                {interaction.state.selectedLeftId ? 'Tap to match' : 'Tap to select'}
              </div>
              {rightItems.map((item) => (
                <MatchingItemButton
                  key={item.id}
                  contentData={item.contentData}
                  mode={mode}
                  isSelected={interaction.isRightItemSelected(item.id)}
                  isMatched={interaction.isRightItemMatched(item.id)}
                  isDisabled={interaction.isRightItemDisabled(item.id)}
                  isWrong={interaction.isRightItemWrong(item.id)}
                  matchColor={getItemMatchColor(item.id, false)}
                  shouldPulseSubtle={
                    interaction.state.selectedLeftId === null &&
                    interaction.state.selectedRightId === null &&
                    !interaction.isRightItemMatched(item.id)
                  }
                  shouldPulse={
                    interaction.state.selectedLeftId !== null &&
                    !interaction.isRightItemMatched(item.id)
                  }
                  shouldNudge={item.id === nudgeRightId}
                  onClick={() => {
                    const isDisabled = interaction.isRightItemDisabled(item.id);
                    if (!isDisabled && isSoundEnabled) {
                      tapHowl.play();
                    }
                    interaction.selectRightItem(item.id);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className='mt-4 mb-10 space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground font-secondary text-sm font-medium'>
                Progress: {interaction.state.matchedPairs.length}/{content.pairs.length} matched
              </span>
              {interaction.attemptsCount > 0 && (
                <span className='text-muted-foreground text-sm'>
                  {interaction.attemptsCount} wrong attempt
                  {interaction.attemptsCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <Progress
              value={(interaction.state.matchedPairs.length / content.pairs.length) * 100}
            />
          </div>

          {/* Completion message */}
          {interaction.isCompleted && (
            <div className='mb-4'>
              <RenderFeedback
                color='success'
                icon={<Check className='h-6 w-6' />}
                label='All matched!'
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
                  </div>
                }
              />
            </div>
          )}
        </PlayPluginWrapper>
      </ViewPluginWrapper>
    );
  },

  /**
   * Scoring logic
   */
  scoring: {
    calculate: (state, content) => {
      const totalPairs = content ? (content as any).pairs?.length || 0 : 0;
      return calculateMatchingGameScore(state, totalPairs);
    },
    getMaxScore: () => 100,
    getPenaltyFactor: () => 0.05, // 5 points per wrong attempt
  },
});

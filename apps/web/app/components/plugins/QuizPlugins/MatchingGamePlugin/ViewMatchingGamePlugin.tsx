import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check } from 'lucide-react';

import type { BlockInteractionSchemaTypes, BuilderSchemaTypes } from '@gonasi/schemas/plugins';

import { MatchingItemButton } from './components/MatchingItemButton';
import { useMatchingGameInteraction } from './hooks/useMatchingGameInteraction';
import { getMatchColor } from './utils/colors';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { RenderFeedback } from '../../common/RenderFeedback';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../PluginRenderers/ViewPluginTypesRenderer';
import { shuffleArray } from '../../utils';

import rightAnswerSound from '/assets/sounds/right-answer.mp3';
import wrongAnswerSound from '/assets/sounds/wrong-answer.mp3';
import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { BlockActionButton } from '~/components/ui/button';
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

type MatchingGamePluginType = Extract<BuilderSchemaTypes, { plugin_type: 'matching_game' }>;

type MatchingGameInteractionType = Extract<
  BlockInteractionSchemaTypes,
  { plugin_type: 'matching_game' }
>;

function isMatchingGameInteraction(data: unknown): data is MatchingGameInteractionType {
  return (
    typeof data === 'object' &&
    data !== null &&
    'plugin_type' in data &&
    (data as any).plugin_type === 'matching_game'
  );
}

export function ViewMatchingGamePlugin({ blockWithProgress }: ViewPluginComponentProps) {
  const {
    settings: { playbackMode, randomization, weight },
    content: { questionState, pairs, hint },
  } = blockWithProgress.block as MatchingGamePluginType;

  const { is_last_block } = blockWithProgress;

  const { mode, isSoundEnabled, isVibrationEnabled } = useStore();

  // Track previous state to detect changes for sound effects and animations
  const prevMatchedCountRef = useRef(0);
  const prevWrongAttemptsCountRef = useRef(0);

  // Track items that should show nudge animation
  const [nudgeLeftId, setNudgeLeftId] = useState<string | null>(null);
  const [nudgeRightId, setNudgeRightId] = useState<string | null>(null);

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

  // Extract interaction data from DB
  const initialInteractionData: MatchingGameInteractionType | null = useMemo(() => {
    if (mode === 'preview') return null;

    const dbInteractionData = blockWithProgress.block_progress?.interaction_data;
    return isMatchingGameInteraction(dbInteractionData) ? dbInteractionData : null;
  }, [blockWithProgress.block_progress?.interaction_data, mode]);

  // Get current data from payload
  const parsedPayloadData: MatchingGameInteractionType | null = useMemo(() => {
    const data = payload?.interaction_data;
    return isMatchingGameInteraction(data) ? data : null;
  }, [payload?.interaction_data]);

  // Use the most recent data (payload takes precedence over initial DB data)
  const currentInteractionData = parsedPayloadData || initialInteractionData;

  const {
    state,
    selectLeftItem,
    selectRightItem,
    isCompleted,
    canInteract,
    score,
    reset,
    attemptsCount,
    isLeftItemSelected,
    isLeftItemMatched,
    isRightItemMatched,
    isRightItemDisabled,
    isRightItemWrong,
  } = useMatchingGameInteraction(currentInteractionData, pairs);

  // Sort items by their indexes or shuffle if randomization is enabled
  const leftItems = useMemo(() => {
    const items = pairs.map((pair) => ({
      id: pair.id,
      content: pair.leftContent,
      index: pair.leftIndex,
    }));
    if (randomization === 'shuffle') {
      return shuffleArray(items);
    }
    return items.sort((a, b) => a.index - b.index);
  }, [pairs, randomization]);

  const rightItems = useMemo(() => {
    const items = pairs.map((pair) => ({
      id: pair.id,
      content: pair.rightContent,
      index: pair.rightIndex,
    }));
    if (randomization === 'shuffle') {
      return shuffleArray(items);
    }
    return items.sort((a, b) => a.index - b.index);
  }, [pairs, randomization]);

  // Get the match color for a specific item based on when it was matched
  const getItemMatchColor = useCallback(
    (itemId: string, isLeft: boolean) => {
      const matchIndex = state.matchedPairs.findIndex((match) =>
        isLeft ? match.leftId === itemId : match.rightId === itemId,
      );
      if (matchIndex === -1) return undefined;
      return getMatchColor(matchIndex);
    },
    [state.matchedPairs],
  );

  // Update interaction data in real-time (play mode only)
  useEffect(() => {
    if (mode === 'play') {
      updateInteractionData({ ...state });
    }
  }, [mode, state, updateInteractionData]);

  useEffect(() => {
    if (mode === 'play') {
      updateEarnedScore(score);
    }
  }, [mode, score, updateEarnedScore]);

  useEffect(() => {
    if (mode === 'play') {
      updateAttemptsCount(attemptsCount);
    }
  }, [mode, attemptsCount, updateAttemptsCount]);

  // Play sound effects, vibrate, and trigger nudge animations on match or wrong attempt
  useEffect(() => {
    const currentMatchedCount = state.matchedPairs.length;
    const currentWrongAttemptsCount = state.wrongAttemptsPerLeftItem.reduce(
      (sum, entry) => sum + entry.wrongRightIds.length,
      0,
    );

    // Correct match - play sound and trigger nudge animation
    if (currentMatchedCount > prevMatchedCountRef.current) {
      if (isSoundEnabled) {
        rightAnswerHowl.play();
      }

      // Get the most recent match to trigger nudge animation
      const latestMatch = state.matchedPairs[state.matchedPairs.length - 1];
      if (latestMatch) {
        setNudgeLeftId(latestMatch.leftId);
        setNudgeRightId(latestMatch.rightId);

        // Clear nudge after animation completes (600ms animation duration)
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
      const latestWrongEntry = state.wrongAttemptsPerLeftItem
        .map((entry) => ({
          leftId: entry.leftId,
          rightId: entry.wrongRightIds[entry.wrongRightIds.length - 1],
        }))
        .filter((item) => item.rightId !== undefined)[0];

      if (latestWrongEntry?.rightId) {
        setNudgeLeftId(latestWrongEntry.leftId);
        setNudgeRightId(latestWrongEntry.rightId);

        // Clear nudge after animation completes (600ms animation duration)
        setTimeout(() => {
          setNudgeLeftId(null);
          setNudgeRightId(null);
        }, 600);
      }
    }

    // Update refs
    prevMatchedCountRef.current = currentMatchedCount;
    prevWrongAttemptsCountRef.current = currentWrongAttemptsCount;
  }, [state.matchedPairs, state.wrongAttemptsPerLeftItem, isSoundEnabled, isVibrationEnabled]);

  return (
    <ViewPluginWrapper
      isComplete={mode === 'preview' ? isCompleted : blockWithProgress.block_progress?.is_completed}
      playbackMode={playbackMode}
      mode={mode}
      weight={weight}
      reset={reset}
    >
      <PlayPluginWrapper hint={hint}>
        {/* Question */}
        <div className='mb-6'>
          <RichTextRenderer editorState={questionState} />
        </div>
        {/* Two-column layout for matching items */}
        <div className='grid grid-cols-2 gap-4 md:gap-6'>
          {/* Left column */}
          <div className='space-y-2 py-2'>
            <div className='text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase'>
              Tap to select
            </div>
            {leftItems.map((item) => (
              <MatchingItemButton
                key={item.id}
                content={item.content}
                isSelected={isLeftItemSelected(item.id)}
                isMatched={isLeftItemMatched(item.id)}
                isDisabled={!canInteract || isLeftItemMatched(item.id)}
                matchColor={getItemMatchColor(item.id, true)}
                shouldNudge={item.id === nudgeLeftId}
                onClick={() => selectLeftItem(item.id)}
              />
            ))}
          </div>

          {/* Right column - with subtle background for distinction */}
          <div className='space-y-2 rounded-lg border p-2 shadow-lg'>
            <div className='text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase'>
              Tap to match
            </div>
            {rightItems.map((item) => (
              <MatchingItemButton
                key={item.id}
                content={item.content}
                isMatched={isRightItemMatched(item.id)}
                isDisabled={isRightItemDisabled(item.id)}
                isWrong={isRightItemWrong(item.id)}
                matchColor={getItemMatchColor(item.id, false)}
                shouldPulse={state.selectedLeftId !== null && !isRightItemMatched(item.id)}
                shouldNudge={item.id === nudgeRightId}
                onClick={() => selectRightItem(item.id)}
              />
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className='mt-6 space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm font-medium'>
              Progress: {state.matchedPairs.length}/{pairs.length} matched
            </span>
            {attemptsCount > 0 && (
              <span className='text-muted-foreground text-sm'>
                {attemptsCount} wrong attempt{attemptsCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Progress value={(state.matchedPairs.length / pairs.length) * 100} />
        </div>

        {/* Completion message */}
        {isCompleted && (
          <div className='mt-6'>
            <RenderFeedback
              color='success'
              icon={<Check className='h-6 w-6' />}
              label='All matched!'
              score={score}
              hasBeenPlayed={blockWithProgress.block_progress?.is_completed}
              actions={
                <div className='flex'>
                  {!blockWithProgress.block_progress?.is_completed && (
                    <BlockActionButton
                      onClick={handleContinue}
                      loading={loading}
                      isLastBlock={is_last_block}
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
}

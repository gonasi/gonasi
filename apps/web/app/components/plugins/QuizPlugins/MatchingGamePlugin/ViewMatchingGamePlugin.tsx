import { useEffect, useMemo } from 'react';
import { PartyPopper, X } from 'lucide-react';

import type { BlockInteractionSchemaTypes, BuilderSchemaTypes } from '@gonasi/schemas/plugins';

import { MatchingItemButton } from './components/MatchingItemButton';
import { useMatchingGameInteraction } from './hooks/useMatchingGameInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { RenderFeedback } from '../../common/RenderFeedback';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../PluginRenderers/ViewPluginTypesRenderer';
import { shuffleArray } from '../../utils';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { AnimateInButtonWrapper, ShowAnswerButton, TryAgainButton } from '~/components/ui/button';
import { useStore } from '~/store';

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
    content: { questionState, pairs, explanationState, hint },
  } = blockWithProgress.block as MatchingGamePluginType;

  const { is_last_block } = blockWithProgress;

  const { mode } = useStore();

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
    revealCorrectAnswer,
    isCompleted,
    tryAgain,
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

  // Shuffle items independently if randomization is enabled
  const leftItems = useMemo(() => {
    const items = pairs.map((pair) => ({ id: pair.id, content: pair.leftContent }));
    return randomization === 'shuffle' ? shuffleArray(items) : items;
  }, [pairs, randomization]);

  const rightItems = useMemo(() => {
    const items = pairs.map((pair) => ({ id: pair.id, content: pair.rightContent }));
    return randomization === 'shuffle' ? shuffleArray(items) : items;
  }, [pairs, randomization]);

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
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          {/* Left column */}
          <div className='space-y-3'>
            <div className='text-muted-foreground mb-3 text-sm font-medium'>Left Items</div>
            {leftItems.map((item) => (
              <MatchingItemButton
                key={item.id}
                content={item.content}
                isSelected={isLeftItemSelected(item.id)}
                isMatched={isLeftItemMatched(item.id)}
                isDisabled={!canInteract || isLeftItemMatched(item.id)}
                onClick={() => selectLeftItem(item.id)}
              />
            ))}
          </div>

          {/* Right column */}
          <div className='space-y-3'>
            <div className='text-muted-foreground mb-3 text-sm font-medium'>Right Items</div>
            {rightItems.map((item) => (
              <MatchingItemButton
                key={item.id}
                content={item.content}
                isMatched={isRightItemMatched(item.id)}
                isDisabled={isRightItemDisabled(item.id)}
                isWrong={isRightItemWrong(item.id)}
                onClick={() => selectRightItem(item.id)}
              />
            ))}
          </div>
        </div>

        {/* Attempts counter */}
        {attemptsCount > 0 && (
          <div className='text-muted-foreground mt-4 text-sm'>
            Attempts: <span className='font-medium'>{attemptsCount}</span>
          </div>
        )}

        {/* Feedback and action buttons */}
        <div className='mt-6 space-y-4'>
          {/* Try Again button */}
          {state.showTryAgainButton && (
            <AnimateInButtonWrapper>
              <TryAgainButton onClick={tryAgain} />
            </AnimateInButtonWrapper>
          )}

          {/* Show Answer button */}
          {state.showShowAnswerButton && !isCompleted && (
            <AnimateInButtonWrapper>
              <ShowAnswerButton onClick={revealCorrectAnswer} />
            </AnimateInButtonWrapper>
          )}

          {/* Feedback message */}
          {isCompleted && (
            <RenderFeedback
              color={state.hasRevealedCorrectAnswer ? 'destructive' : 'success'}
              icon={
                state.hasRevealedCorrectAnswer ? (
                  <X className='h-6 w-6' />
                ) : (
                  <PartyPopper className='h-6 w-6' />
                )
              }
              label={state.hasRevealedCorrectAnswer ? 'Answer Revealed' : 'Great job!'}
              score={score}
              actions={
                <AnimateInButtonWrapper>
                  <button
                    type='button'
                    onClick={() => handleContinue()}
                    disabled={loading}
                    className='text-primary hover:text-primary/80 text-sm font-medium'
                  >
                    {is_last_block ? 'Complete Lesson' : 'Continue'}
                  </button>
                </AnimateInButtonWrapper>
              }
            />
          )}
        </div>
      </PlayPluginWrapper>
    </ViewPluginWrapper>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check } from 'lucide-react';

import type { BlockInteractionSchemaTypes, BuilderSchemaTypes } from '@gonasi/schemas/plugins';

import { CategoryLabels } from './components/CategoryLabels';
import { SwipeButtons } from './components/SwipeButtons';
import { SwipeCard, type SwipeCardRef } from './components/SwipeCard';
import { useSwipeCategorizeInteraction } from './hooks/useSwipeCategorizeInteraction';
import { shuffleArray } from './utils';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { RenderFeedback } from '../../common/RenderFeedback';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../PluginRenderers/ViewPluginTypesRenderer';

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

type SwipeCategorizePluginType = Extract<BuilderSchemaTypes, { plugin_type: 'swipe_categorize' }>;

type SwipeCategorizeInteractionType = Extract<
  BlockInteractionSchemaTypes,
  { plugin_type: 'swipe_categorize' }
>;

function isSwipeCategorizeInteraction(data: unknown): data is SwipeCategorizeInteractionType {
  return (
    typeof data === 'object' &&
    data !== null &&
    'plugin_type' in data &&
    (data as any).plugin_type === 'swipe_categorize'
  );
}

export function ViewSwipeCategorizePlugin({ blockWithProgress }: ViewPluginComponentProps) {
  const {
    settings: { playbackMode, randomization, weight },
    content: { questionState, cards, leftLabel, rightLabel, hint },
  } = blockWithProgress.block as SwipeCategorizePluginType;

  const { is_last_block } = blockWithProgress;

  const { mode, isSoundEnabled, isVibrationEnabled } = useStore();

  // Ref for SwipeCard to call imperative methods
  const cardRef = useRef<SwipeCardRef>(null);

  // Track previous state to detect changes for sound effects
  const prevCorrectSwipesRef = useRef(0);
  const prevWrongSwipesRef = useRef(0);

  // Track blocked direction after wrong swipe
  const [blockedDirection, setBlockedDirection] = useState<'left' | 'right' | null>(null);

  // Track drag offset for category label highlighting
  const [dragOffset] = useState(0);

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
  const initialInteractionData: SwipeCategorizeInteractionType | null = useMemo(() => {
    if (mode === 'preview') return null;

    const dbInteractionData = blockWithProgress.block_progress?.interaction_data;
    return isSwipeCategorizeInteraction(dbInteractionData) ? dbInteractionData : null;
  }, [blockWithProgress.block_progress?.interaction_data, mode]);

  // Get current data from payload
  const parsedPayloadData: SwipeCategorizeInteractionType | null = useMemo(() => {
    const data = payload?.interaction_data;
    return isSwipeCategorizeInteraction(data) ? data : null;
  }, [payload?.interaction_data]);

  // Use the most recent data (payload takes precedence over initial DB data)
  const currentInteractionData = parsedPayloadData || initialInteractionData;

  // Sort and shuffle cards based on randomization setting
  const processedCards = useMemo(() => {
    const sortedCards = [...cards].sort((a, b) => a.index - b.index);
    if (randomization === 'shuffle') {
      return shuffleArray(sortedCards);
    }
    return sortedCards;
  }, [cards, randomization]);

  const {
    state,
    swipeLeft,
    swipeRight,
    trackWrongSwipe,
    isCompleted,
    canInteract,
    currentCard,
    progress,
    score,
    reset,
    wrongSwipesCount,
  } = useSwipeCategorizeInteraction(currentInteractionData, processedCards);

  // Reset blocked direction when card changes
  useEffect(() => {
    setBlockedDirection(null);
  }, [currentCard?.id]);

  // Handle wrong swipe - block that direction AND track it in state
  const handleWrongSwipe = (direction: 'left' | 'right') => {
    setBlockedDirection(direction);
    trackWrongSwipe(direction);
  };

  // Button handlers that use the card ref
  const handleButtonLeft = () => {
    if (blockedDirection === 'left') return;
    cardRef.current?.swipeLeft();
  };

  const handleButtonRight = () => {
    if (blockedDirection === 'right') return;
    cardRef.current?.swipeRight();
  };

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
      updateAttemptsCount(wrongSwipesCount);
    }
  }, [mode, wrongSwipesCount, updateAttemptsCount]);

  // Play sound effects and vibrate on swipe
  useEffect(() => {
    const currentCorrectSwipes =
      state.leftBucket.filter((item) => item.wasCorrect).length +
      state.rightBucket.filter((item) => item.wasCorrect).length;
    const currentWrongSwipes = state.wrongSwipes.length;

    // Correct swipe - play success sound
    if (currentCorrectSwipes > prevCorrectSwipesRef.current) {
      if (isSoundEnabled) {
        rightAnswerHowl.play();
      }
    }

    // Wrong swipe - play error sound and vibrate
    if (currentWrongSwipes > prevWrongSwipesRef.current) {
      if (isSoundEnabled) {
        wrongAnswerHowl.play();
      }
      if (isVibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }

    // Update refs
    prevCorrectSwipesRef.current = currentCorrectSwipes;
    prevWrongSwipesRef.current = currentWrongSwipes;
  }, [state.leftBucket, state.rightBucket, state.wrongSwipes, isSoundEnabled, isVibrationEnabled]);

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

        {/* Category Labels */}
        <CategoryLabels leftLabel={leftLabel} rightLabel={rightLabel} dragOffset={dragOffset} />

        {/* Card Stack */}
        <div className='relative mx-auto flex min-h-[400px] w-full max-w-md items-center justify-center'>
          {currentCard ? (
            <SwipeCard
              ref={cardRef}
              content={currentCard.content}
              onSwipeLeft={swipeLeft}
              onSwipeRight={swipeRight}
              onWrongSwipe={handleWrongSwipe}
              dragEnabled={canInteract}
              cardNumber={state.currentCardIndex + 1}
              totalCards={processedCards.length}
              correctCategory={currentCard.correctCategory}
              disabledDirection={blockedDirection}
            />
          ) : (
            <div className='text-muted-foreground text-center'>
              {isCompleted ? 'All cards sorted!' : 'No cards available'}
            </div>
          )}
        </div>

        {/* Swipe Buttons (Desktop) */}
        <SwipeButtons
          onSwipeLeft={handleButtonLeft}
          onSwipeRight={handleButtonRight}
          disabled={!canInteract || !currentCard}
          disabledLeft={blockedDirection === 'left'}
          disabledRight={blockedDirection === 'right'}
        />

        {/* Progress Bar */}
        <div className='mt-6 space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm font-medium'>
              Progress: {state.leftBucket.length + state.rightBucket.length}/{processedCards.length}{' '}
              cards sorted
            </span>
            {wrongSwipesCount > 0 && (
              <span className='text-muted-foreground text-sm'>
                {wrongSwipesCount} wrong swipe{wrongSwipesCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Progress value={progress} />
        </div>

        {/* Completion message */}
        {isCompleted && (
          <div className='mt-6'>
            <RenderFeedback
              color='success'
              icon={<Check className='h-6 w-6' />}
              label='All cards categorized!'
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

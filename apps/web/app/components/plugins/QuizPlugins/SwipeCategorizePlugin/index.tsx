import { useEffect, useMemo, useRef, useState } from 'react';
import { PartyPopper, Settings } from 'lucide-react';

import {
  EMPTY_LEXICAL_STATE,
  SwipeCategorizeContentSchema,
  type SwipeCategorizeContentSchemaTypes,
  SwipeCategorizeInteractionSchema,
  SwipeCategorizeSchema,
  SwipeCategorizeSettingsSchema,
  type SwipeCategorizeSettingsSchemaTypes,
} from '@gonasi/schemas/plugins';

import { CategoryLabels } from './components/CategoryLabels';
import { ReviewCarousel } from './components/ReviewCarousel';
import { SwipeButtons } from './components/SwipeButtons';
import { SwipeCard, type SwipeCardRef } from './components/SwipeCard';
import { useSwipeCategorizeInteraction } from './hooks/useSwipeCategorizeInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { RenderFeedback } from '../../common/RenderFeedback';
import { BlockWeightField } from '../../common/settings/BlockWeightField';
import { PlaybackModeField } from '../../common/settings/PlaybackModeField';
import { RandomizationModeField } from '../../common/settings/RandomizationModeField';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { createPlugin } from '../../core';
import { calculateSwipeCategorizeScore, shuffleArray } from './utils';

import rightAnswerSound from '/assets/sounds/right-answer.mp3';
import wrongAnswerSound from '/assets/sounds/wrong-answer.mp3';
import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { BlockActionButton } from '~/components/ui/button';
import {
  GoCardField,
  GoInputField,
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

/**
 * Default content for new Swipe Categorize blocks
 */
const defaultContent: SwipeCategorizeContentSchemaTypes = {
  questionState: EMPTY_LEXICAL_STATE,
  leftLabel: 'Left',
  rightLabel: 'Right',
  cards: [],
};

/**
 * Default settings for new Swipe Categorize blocks
 */
const defaultSettings: SwipeCategorizeSettingsSchemaTypes = {
  playbackMode: 'inline',
  weight: 4,
  randomization: 'shuffle',
};

// Migration helper: Convert old card format to new format
function migrateCardToNewFormat(card: any): any {
  if ('contentData' in card) {
    return card;
  }

  if ('content' in card) {
    return {
      ...card,
      contentData: {
        type: 'richtext',
        content: card.content,
      },
      content: undefined,
    };
  }

  return card;
}

/**
 * Swipe Categorize Plugin
 *
 * Refactored using the new plugin architecture.
 * Features drag-to-swipe cards, sound effects, and review carousel.
 *
 * Before: ~593 lines (Builder + View)
 * After: ~440 lines (including complex UI and animations)
 * Reduction: ~26%
 */
export const SwipeCategorizePlugin = createPlugin({
  pluginType: 'swipe_categorize',

  metadata: {
    name: 'Swipe Categorize',
    description: 'Swipe cards left or right to categorize them',
    icon: 'ArrowLeftRight',
    category: 'quiz',
  },

  schemas: {
    builder: SwipeCategorizeSchema,
    content: SwipeCategorizeContentSchema,
    settings: SwipeCategorizeSettingsSchema,
    interaction: SwipeCategorizeInteractionSchema as any,
  },

  defaults: {
    content: defaultContent,
    settings: defaultSettings,
  },

  hooks: {
    useInteraction: useSwipeCategorizeInteraction,
  },

  /**
   * Content migration - convert old card format to new format
   */
  migrations: {
    migrateContent: (oldContent: any) => {
      if (!oldContent.cards) return oldContent;

      return {
        ...oldContent,
        cards: oldContent.cards.map(migrateCardToNewFormat),
      };
    },
  },

  /**
   * Builder UI - Form fields for content creation
   */
  renderBuilder: ({ methods }) => {
    const watchLeftLabel = methods.getValues('content.leftLabel');
    const watchRightLabel = methods.getValues('content.rightLabel');

    return (
      <>
        <GoRichTextInputField
          name='content.questionState'
          labelProps={{ children: 'Question', required: true }}
          placeholder='Enter your swipe categorize question or instructions...'
          description='What should learners categorize? Make it clear and engaging!'
        />

        <div className='grid grid-cols-2 gap-4'>
          <GoInputField
            name='content.leftLabel'
            labelProps={{ children: 'Left Category Label', required: true }}
            inputProps={{
              placeholder: 'e.g., True, Correct, Fact',
              maxLength: 20,
            }}
            description='Label for the left category (max 20 characters)'
          />

          <GoInputField
            name='content.rightLabel'
            labelProps={{ children: 'Right Category Label', required: true }}
            inputProps={{
              placeholder: 'e.g., False, Incorrect, Opinion',
              maxLength: 20,
            }}
            description='Label for the right category (max 20 characters)'
          />
        </div>

        <GoCardField
          name='content.cards'
          labelProps={{ children: 'Cards', required: true }}
          description='Add 3-20 cards. Each card will be swiped left or right into the correct category.'
          minCards={3}
          maxCards={20}
          leftLabel={watchLeftLabel || 'Left'}
          rightLabel={watchRightLabel || 'Right'}
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
   * View UI - Interactive swipe categorization
   */
  renderView: function SwipeCategorizeView({
    interaction,
    content,
    settings,
    mode,
    blockWithProgress,
    loading,
    handleContinue,
  }) {
    const { isSoundEnabled, isVibrationEnabled } = useStore();

    // Ref for SwipeCard to call imperative methods
    const cardRef = useRef<SwipeCardRef>(null);

    // Track previous state to detect changes for sound effects
    const prevCorrectSwipesRef = useRef(0);
    const prevWrongSwipesRef = useRef(0);

    // Track blocked direction after wrong swipe
    const [blockedDirection, setBlockedDirection] = useState<'left' | 'right' | null>(null);

    // Track drag offset for category label highlighting
    const [dragOffset] = useState(0);

    // Sort and shuffle cards based on randomization setting, with migration
    const processedCards = useMemo(() => {
      const migratedCards = content.cards.map(migrateCardToNewFormat);
      const sortedCards = [...migratedCards].sort((a, b) => a.index - b.index);
      if (settings.randomization === 'shuffle') {
        return shuffleArray(sortedCards);
      }
      return sortedCards;
    }, [content.cards, settings.randomization]);

    // Reset blocked direction when card changes
    useEffect(() => {
      setBlockedDirection(null);
    }, [interaction.currentCard?.id]);

    // Handle wrong swipe - block that direction AND track it in state
    const handleWrongSwipe = (direction: 'left' | 'right') => {
      setBlockedDirection(direction);
      interaction.trackWrongSwipe(direction);
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

    // Play sound effects and vibrate on swipe
    useEffect(() => {
      const currentCorrectSwipes =
        interaction.state.leftBucket.filter((item) => item.wasCorrect).length +
        interaction.state.rightBucket.filter((item) => item.wasCorrect).length;
      const currentWrongSwipes = interaction.state.wrongSwipes.length;

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
    }, [
      interaction.state.leftBucket,
      interaction.state.rightBucket,
      interaction.state.wrongSwipes,
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
          {!interaction.isCompleted ? (
            <>
              {/* Question */}
              <div className='mb-6'>
                <RichTextRenderer editorState={content.questionState} />
              </div>

              {/* Category Labels */}
              <CategoryLabels
                leftLabel={content.leftLabel}
                rightLabel={content.rightLabel}
                dragOffset={dragOffset}
              />

              {/* Card Stack */}
              <div className='relative z-5 mx-auto grid h-[400px] w-full place-items-center'>
                {processedCards.length > 0 ? (
                  (() => {
                    const remainingCards = processedCards.slice(interaction.state.currentCardIndex);
                    return remainingCards.map((card, index) => {
                      const isFront = index === 0;
                      return (
                        <SwipeCard
                          key={card.id}
                          ref={isFront ? cardRef : null}
                          cardData={card}
                          mode={mode}
                          onSwipeLeft={interaction.swipeLeft}
                          onSwipeRight={interaction.swipeRight}
                          onWrongSwipe={handleWrongSwipe}
                          dragEnabled={interaction.canInteract}
                          correctCategory={card.correctCategory}
                          disabledDirection={blockedDirection}
                          isFront={isFront}
                          stackIndex={index}
                        />
                      );
                    });
                  })()
                ) : (
                  <div className='text-muted-foreground text-center'>No cards available</div>
                )}
              </div>

              {/* Swipe Buttons (Desktop) */}
              <SwipeButtons
                onSwipeLeft={handleButtonLeft}
                onSwipeRight={handleButtonRight}
                disabled={!interaction.canInteract || !interaction.currentCard}
                disabledLeft={blockedDirection === 'left'}
                disabledRight={blockedDirection === 'right'}
              />

              {/* Progress Bar */}
              <div className='mt-6 space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground text-sm font-medium'>
                    Progress:{' '}
                    {interaction.state.leftBucket.length + interaction.state.rightBucket.length}/
                    {processedCards.length} cards sorted
                  </span>
                  {interaction.wrongSwipesCount > 0 && (
                    <span className='text-muted-foreground text-sm'>
                      {interaction.wrongSwipesCount} wrong swipe
                      {interaction.wrongSwipesCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <Progress value={interaction.progress} />
              </div>
            </>
          ) : (
            <>
              {/* Review Carousel */}
              <div className='my-6'>
                <ReviewCarousel
                  cards={processedCards}
                  state={interaction.state}
                  leftLabel={content.leftLabel}
                  rightLabel={content.rightLabel}
                  mode={mode}
                />
              </div>
              {/* Completion Feedback */}
              <div className='mb-4'>
                <RenderFeedback
                  color='success'
                  icon={<PartyPopper />}
                  label='All cards categorized!'
                  score={interaction.score}
                  hasBeenPlayed={blockWithProgress.block_progress?.is_completed}
                  actions={
                    !blockWithProgress.block_progress?.is_completed && (
                      <BlockActionButton
                        onClick={handleContinue}
                        loading={loading}
                        isLastBlock={blockWithProgress.is_last_block}
                        disabled={mode === 'preview'}
                      />
                    )
                  }
                />
              </div>
            </>
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
      const totalCards = content ? (content as any).cards?.length || 0 : 0;
      return calculateSwipeCategorizeScore(state, totalCards);
    },
    getMaxScore: () => 100,
    getPenaltyFactor: () => 0.15, // Varies based on error rate (proportional)
  },
});

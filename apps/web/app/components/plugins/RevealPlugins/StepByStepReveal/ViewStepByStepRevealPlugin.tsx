import { useEffect, useMemo, useState } from 'react';

import type {
  BlockInteractionSchemaTypes,
  BuilderSchemaTypes,
  StepByStepRevealCardSchemaTypes,
} from '@gonasi/schemas/plugins';

import { SlideIndicator } from './components/SlideIndicator';
import { TapToRevealCard } from './components/TapToRevealCard';
import { useStepByStepRevealInteraction } from './hooks/useStepByStepRevealInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../PluginRenderers/ViewPluginTypesRenderer';
import { shuffleArray } from '../../utils';

import { NotFoundCard } from '~/components/cards';
import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { BlockActionButton } from '~/components/ui/button';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/ui/carousel';
import { useStore } from '~/store';

type StepByStepRevealPluginType = Extract<
  BuilderSchemaTypes,
  { plugin_type: 'step_by_step_reveal' }
>;

type StepByStepRevealInteractionType = Extract<
  BlockInteractionSchemaTypes,
  { plugin_type: 'step_by_step_reveal' }
>;

function isStepByStepRevealInteraction(data: unknown): data is StepByStepRevealInteractionType {
  return (
    typeof data === 'object' &&
    data !== null &&
    'plugin_type' in data &&
    (data as any).plugin_type === 'step_by_step_reveal'
  );
}

export function ViewStepByStepRevealPlugin({ blockWithProgress }: ViewPluginComponentProps) {
  const {
    settings: { playbackMode, layoutStyle, randomization, weight },
    content: { title, cards },
  } = blockWithProgress.block as StepByStepRevealPluginType;

  const { is_last_block } = blockWithProgress;

  const { mode } = useStore();

  const { loading, payload, handleContinue, updateInteractionData } = useViewPluginCore(
    mode === 'play' ? { progress: blockWithProgress.block_progress, blockWithProgress } : null,
  );

  // Extract interaction data from DB - this is the key change
  const initialInteractionData: StepByStepRevealInteractionType | null = useMemo(() => {
    if (mode === 'preview') return null;

    // Get interaction data from the database via block progress
    const dbInteractionData = blockWithProgress.block_progress?.interaction_data;

    return isStepByStepRevealInteraction(dbInteractionData) ? dbInteractionData : null;
  }, [blockWithProgress.block_progress?.interaction_data, mode]);

  // Also get the current selected option from payload if available
  const parsedPayloadData: StepByStepRevealInteractionType | null = useMemo(() => {
    const data = payload?.interaction_data;
    return isStepByStepRevealInteraction(data) ? data : null;
  }, [payload?.interaction_data]);

  // Use the most recent data (payload takes precedence over initial DB data)
  const currentInteractionData = parsedPayloadData || initialInteractionData;

  const cardsOptions = useMemo(() => {
    return randomization === 'shuffle' ? shuffleArray(cards) : cards;
  }, [cards, randomization]);

  const {
    state,

    // Derived state
    isCompleted,
    currentCardIndex,
    currentCard,
    nextCard,
    previousCard,
    progress,
    revealedCardIds,
    canRevealNext,
    canGoBack,

    // Actions
    revealCard,
    revealNext,
    reset,

    // Helpers
    isCardRevealed,
    getCardRevealTime,
    getRevealedCards,
  } = useStepByStepRevealInteraction(currentInteractionData, cardsOptions);

  useEffect(() => {
    if (mode === 'play') {
      console.log('Updating interaction data:', state); // Debug log
      updateInteractionData({ ...state });
    }
  }, [mode, state, updateInteractionData]);

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const itemsPerSlide = layoutStyle === 'single' ? 1 : 2;

  useEffect(() => {
    if (!api) {
      return;
    }
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // Calculate if all visible cards on current slide are revealed
  const allVisibleCardsRevealed = useMemo(() => {
    if (!api) return false;

    const currentSlideIndex = current - 1; // Convert to 0-indexed
    const startIndex = currentSlideIndex * itemsPerSlide;
    const endIndex = Math.min(startIndex + itemsPerSlide, cardsOptions.length);

    const visibleCards = cardsOptions.slice(startIndex, endIndex);
    return visibleCards.every((card) => isCardRevealed(card.id));
  }, [api, current, itemsPerSlide, cardsOptions, isCardRevealed]);

  // Determine if we should nudge the next arrow
  const shouldNudgeNext = useMemo(() => {
    if (!api) return false;
    const canGoNext = api.canScrollNext();
    return allVisibleCardsRevealed && canGoNext && !isCompleted;
  }, [api, allVisibleCardsRevealed, isCompleted]);

  // Get unrevealed card IDs on the current slide for flashing
  const unrevealedCardsOnCurrentSlide = useMemo(() => {
    if (!api) return new Set<string>();

    const currentSlideIndex = current - 1;
    const startIndex = currentSlideIndex * itemsPerSlide;
    const endIndex = Math.min(startIndex + itemsPerSlide, cardsOptions.length);

    const visibleCards = cardsOptions.slice(startIndex, endIndex);
    return new Set(visibleCards.filter((card) => !isCardRevealed(card.id)).map((card) => card.id));
  }, [api, current, itemsPerSlide, cardsOptions, isCardRevealed]);

  const renderCard = (card: StepByStepRevealCardSchemaTypes) => {
    const shouldFlash = unrevealedCardsOnCurrentSlide.has(card.id) && !isCompleted;

    return (
      <TapToRevealCard
        key={card.id}
        cardId={card.id}
        isRevealed={isCardRevealed(card.id)}
        canReveal={currentCard?.id === card.id}
        onReveal={revealCard}
        front={<RichTextRenderer editorState={card.frontContent} />}
        back={<RichTextRenderer editorState={card.backContent} />}
        shouldFlash={shouldFlash}
      />
    );
  };

  return (
    <ViewPluginWrapper
      isComplete={mode === 'preview' ? isCompleted : blockWithProgress.block_progress?.is_completed}
      playbackMode={playbackMode}
      mode={mode}
      reset={reset}
      weight={weight}
      infoText='Tap To Reveal'
    >
      <PlayPluginWrapper>
        <div className='mb-4'>
          <RichTextRenderer editorState={title} />
        </div>

        <div>
          {!cardsOptions || cardsOptions.length === 0 ? (
            <NotFoundCard message='No cards found' />
          ) : cardsOptions.length === 1 && cardsOptions[0] ? (
            // Single card - use same hook-based approach
            <div className='flex w-full items-center justify-center'>
              {renderCard(cardsOptions[0])}
            </div>
          ) : (
            <div>
              <Carousel
                setApi={setApi}
                key={`carousel-${itemsPerSlide}`}
                opts={{
                  align: 'start',
                  slidesToScroll: itemsPerSlide,
                  containScroll: 'trimSnaps',
                }}
                className='mx-auto w-full'
              >
                <CarouselContent className='py-4'>
                  {cardsOptions.map((card) => {
                    return (
                      <CarouselItem
                        key={card.id}
                        className={`pl-4 ${itemsPerSlide === 2 ? 'basis-1/2' : 'basis-full'}`}
                      >
                        <div className='flex w-full items-center justify-center'>
                          {renderCard(card)}
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext
                  shouldNudge={shouldNudgeNext}
                  customDisabled={!allVisibleCardsRevealed}
                />
              </Carousel>
              <SlideIndicator current={current} count={count} />
            </div>
          )}
        </div>
        <div className='flex w-full justify-end py-4'>
          {isCompleted && !blockWithProgress.block_progress?.is_completed && (
            <BlockActionButton
              onClick={handleContinue}
              loading={loading}
              isLastBlock={is_last_block}
              disabled={mode === 'preview'}
            />
          )}
        </div>
      </PlayPluginWrapper>
    </ViewPluginWrapper>
  );
}

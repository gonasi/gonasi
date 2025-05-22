import { useEffect, useState } from 'react';

import type { TapToRevealInteractionType, TapToRevealSchemaType } from '@gonasi/schemas/plugins';

import { TapToRevealCard } from './components/TapToRevealCard';
import { useTapToRevealInteraction } from './hooks/useTapToRevealInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../upperRend.tsx';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { AnimateInButtonWrapper, BlockActionButton } from '~/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselIndicators,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/ui/carousel/custom-carousel';

export function ViewTapToRevealPlugin({ block, mode }: ViewPluginComponentProps) {
  const { blockInteractionData, updatePayload, loading, canRender, handleContinue, isLastBlock } =
    useViewPluginCore({
      blockId: block.id,
      pluginType: block.plugin_type,
      settings: block.settings,
    });

  const { is_complete, state: blockInteractionStateData } = blockInteractionData ?? {};
  const { playbackMode } = block.settings;
  const { title, cards } = block.content as TapToRevealSchemaType;

  const itemsPerSlide = 2;
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const { state, revealCard, hasInteractedWithCard, canNavigateNext, getProgress } =
    useTapToRevealInteraction(
      cards,
      itemsPerSlide,
      blockInteractionStateData as TapToRevealInteractionType,
    );

  const shouldShowActionButton = !is_complete && mode !== 'preview';

  // Update interaction data when state changes
  useEffect(() => {
    if (state) {
      updatePayload({
        is_complete: state.continue,
        state: {
          ...state,
          interactionType: 'tap_to_reveal',
        },
      });
    }
  }, [state, updatePayload, getProgress]);

  // Manage slide change
  const handleSlideChange = (index: number) => {
    setCurrentSlideIndex(index);
  };

  const progress = getProgress();
  const allCardsRevealed = progress.complete;

  if (!canRender) return <></>;

  return (
    <ViewPluginWrapper
      isComplete={is_complete || progress.complete}
      playbackMode={playbackMode}
      mode={mode}
    >
      <PlayPluginWrapper>
        <div className='mb-4'>
          <RichTextRenderer editorState={title} />
          {progress.total > 0 && (
            <div className='mt-1 text-sm text-gray-500'>
              Progress: {progress.revealed}/{progress.total} cards revealed
            </div>
          )}
        </div>

        <div>
          <Carousel
            className='mx-auto w-full'
            key={`carousel-${itemsPerSlide}`}
            opts={{
              align: 'start',
              slidesToScroll: itemsPerSlide,
              containScroll: 'trimSnaps',
            }}
            // onSlideChange={handleSlideChange}
          >
            <CarouselContent>
              {cards.map((card) => (
                <CarouselItem
                  key={card.uuid}
                  className={itemsPerSlide === 2 ? 'basis-1/2' : 'basis-full'}
                >
                  <div className='flex w-full items-center justify-center p-2'>
                    <TapToRevealCard
                      front={<RichTextRenderer editorState={card.frontContent} />}
                      back={<RichTextRenderer editorState={card.backContent} />}
                      revealed={hasInteractedWithCard(card.uuid)}
                      onToggle={() => revealCard(card.uuid)}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            <div className='flex w-full items-center justify-between py-4'>
              <CarouselPrevious />
              <CarouselIndicators />
              <CarouselNext disabled={!canNavigateNext(currentSlideIndex)} />
            </div>
          </Carousel>
        </div>

        {/* Continue button for when all cards are revealed */}
        {allCardsRevealed && shouldShowActionButton && (
          <div className='mt-4 flex w-full justify-end'>
            <AnimateInButtonWrapper>
              <BlockActionButton
                onClick={handleContinue}
                loading={loading}
                isLastBlock={isLastBlock}
              />
            </AnimateInButtonWrapper>
          </div>
        )}
      </PlayPluginWrapper>
    </ViewPluginWrapper>
  );
}

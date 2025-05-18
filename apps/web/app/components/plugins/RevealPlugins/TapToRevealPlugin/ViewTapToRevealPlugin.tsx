import { useState } from 'react';

import type { TapToRevealSchemaType } from '@gonasi/schemas/plugins';

import { TapToRevealCard } from './components/TapToRevealCard';
import { useTapToRevealInteraction } from './hooks/useTapToRevealInteraction'; // <-- Your updated hook
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../viewPluginTypesRenderer';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import {
  Carousel,
  CarouselContent,
  CarouselIndicators,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/ui/carousel/custom-carousel';

export function ViewTapToRevealPlugin({ block, mode }: ViewPluginComponentProps) {
  const { blockInteractionData } = useViewPluginCore({
    blockId: block.id,
    pluginType: block.plugin_type,
    settings: block.settings,
  });

  const { is_complete } = blockInteractionData ?? {};
  const { playbackMode } = block.settings;
  const { title, cards } = block.content as TapToRevealSchemaType;

  const itemsPerSlide = 2; // numeric for logic

  const { state, revealCard, hasInteractedWithCard, canNavigateNext } = useTapToRevealInteraction(
    cards,
    itemsPerSlide,
  );

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  return (
    <ViewPluginWrapper isComplete={is_complete} playbackMode={playbackMode} mode={mode}>
      <PlayPluginWrapper>
        <RichTextRenderer editorState={title} />
        <div>
          <Carousel
            className='mx-auto w-full'
            key={itemsPerSlide}
            opts={{
              align: 'start',
              slidesToScroll: itemsPerSlide,
              containScroll: 'trimSnaps',
            }}
            onSlideChange={(index) => setCurrentSlideIndex(index)}
          >
            <CarouselContent>
              {cards.map((card, index) => (
                <CarouselItem
                  key={card.uuid}
                  className={itemsPerSlide === 2 ? 'basis-1/2' : 'basis-full'}
                >
                  <div className='flex w-full items-center justify-center'>
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
      </PlayPluginWrapper>
    </ViewPluginWrapper>
  );
}

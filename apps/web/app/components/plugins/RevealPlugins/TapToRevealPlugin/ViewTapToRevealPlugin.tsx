import { useState } from 'react';

import type { TapToRevealSchemaType } from '@gonasi/schemas/plugins';

import { TapToRevealCard } from './components/TapToRevealCard';
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
  const {
    loading,
    canRender,
    handleContinue,
    blockInteractionData,
    isLastBlock,
    updatePayload,
    setExplanationState,
    isExplanationBottomSheetOpen,
  } = useViewPluginCore({
    blockId: block.id,
    pluginType: block.plugin_type,
    settings: block.settings,
  });

  const { is_complete, state: blockInteractionStateData } = blockInteractionData ?? {};
  const { playbackMode, layoutStyle } = block.settings;
  const { title, cards } = block.content as TapToRevealSchemaType;

  // Sync interaction state with plugin state
  // useEffect(() => {
  //   updatePayload({
  //     is_complete: state.continue,
  //     score: userScore,
  //     attempts: state.attemptsCount,
  //     state: {
  //       ...state,
  //       interactionType: 'true_false',
  //       continue: state.continue,
  //       optionSelected: selectedOption,
  //       correctAttempt: state.correctAttempt,
  //       wrongAttempts: state.wrongAttempts,
  //     },
  //   });
  // }, [state, selectedOption, correctAnswer, updatePayload, userScore]);
  const [revealed, setRevealed] = useState(false);

  const itemsPerSlide = '2';

  if (!canRender) return <></>;

  return (
    <ViewPluginWrapper isComplete={is_complete} playbackMode={playbackMode} mode={mode}>
      <PlayPluginWrapper>
        {/* Question */}
        <RichTextRenderer editorState={title} />
        <div>
          <Carousel
            className='mx-auto w-full border border-red-500'
            key={itemsPerSlide}
            opts={{
              align: 'start',
              slidesToScroll: itemsPerSlide === '2' ? 2 : 1,
              containScroll: 'trimSnaps',
            }}
          >
            <CarouselContent>
              {cards && cards.length
                ? cards.map(({ frontContent, backContent }, index) => (
                    <CarouselItem
                      key={index}
                      className={itemsPerSlide === '2' ? 'basis-1/2' : 'basis-full'}
                    >
                      <TapToRevealCard
                        key={index}
                        front={<RichTextRenderer editorState={frontContent} />}
                        back={<RichTextRenderer editorState={backContent} />}
                        revealed={revealed}
                        onToggle={setRevealed}
                      />
                    </CarouselItem>
                  ))
                : null}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
            <CarouselIndicators />
          </Carousel>
        </div>
      </PlayPluginWrapper>
      {/* <TrueOrFalseInteractionDebug interaction={interaction} /> */}
    </ViewPluginWrapper>
  );
}

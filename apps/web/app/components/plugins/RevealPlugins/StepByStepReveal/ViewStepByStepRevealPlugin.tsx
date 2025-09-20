import { useMemo } from 'react';

import type { BlockInteractionSchemaTypes, BuilderSchemaTypes } from '@gonasi/schemas/plugins';

import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../PluginRenderers/ViewPluginTypesRenderer';
import { TapToRevealCard } from '../TapToRevealPlugin/components/TapToRevealCard';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { Carousel } from '~/components/ui/carousel';
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
    content: { id, title, cards },
  } = blockWithProgress.block as StepByStepRevealPluginType;

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

  return (
    <ViewPluginWrapper
      isComplete={mode === 'preview' ? true : blockWithProgress.block_progress?.is_completed}
      playbackMode={playbackMode}
      mode={mode}
      reset={() => {}}
      weight={weight}
    >
      <PlayPluginWrapper>
        <div className='mb-4'>
          <RichTextRenderer editorState={title} />
        </div>

        <div>
          {!cards || cards.length === 0 ? (
            <p>No cards found</p>
          ) : cards.length === 1 && cards[0] ? (
            // 👇 Single card
            <div className='flex w-full items-center justify-center'>
              <TapToRevealCard
                key={cards[0].id}
                front={<RichTextRenderer editorState={cards[0].frontContent} />}
                back={<RichTextRenderer editorState={cards[0].backContent} />}
                revealed
                onToggle={() => {}}
              />
            </div>
          ) : (
            // 👇 Multiple cards (wrap in a carousel, grid, etc.)
            <Carousel>
              {cards.map((card) => (
                <TapToRevealCard
                  key={card.id}
                  front={<RichTextRenderer editorState={card.frontContent} />}
                  back={<RichTextRenderer editorState={card.backContent} />}
                  revealed
                  onToggle={() => {}}
                />
              ))}
            </Carousel>
          )}
        </div>
      </PlayPluginWrapper>
    </ViewPluginWrapper>
  );
}

import { useEffect, useMemo } from 'react';

import type {
  BlockInteractionSchemaTypes,
  BuilderSchemaTypes,
  StepByStepRevealCardSchemaTypes,
} from '@gonasi/schemas/plugins';

import { useStepByStepRevealInteraction } from './hooks/useStepByStepRevealInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../PluginRenderers/ViewPluginTypesRenderer';
import { shuffleArray } from '../../utils';
import { TapToRevealCard } from '../TapToRevealPlugin/components/TapToRevealCard';

import { NotFoundCard } from '~/components/cards';
import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
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

  const renderCard = (card: StepByStepRevealCardSchemaTypes) => (
    <TapToRevealCard
      key={card.id}
      cardId={card.id}
      isRevealed={isCardRevealed(card.id)}
      canReveal={currentCard?.id === card.id}
      onReveal={revealCard}
      front={<RichTextRenderer editorState={card.frontContent} />}
      back={<RichTextRenderer editorState={card.backContent} />}
    />
  );

  return (
    <ViewPluginWrapper
      isComplete={mode === 'preview' ? isCompleted : blockWithProgress.block_progress?.is_completed}
      playbackMode={playbackMode}
      mode={mode}
      reset={reset}
      weight={weight}
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
            <div>{cardsOptions.map((card) => renderCard(card))}</div>
          )}
        </div>
      </PlayPluginWrapper>
    </ViewPluginWrapper>
  );
}

import { useState } from 'react';

import type { TapToRevealSchemaType } from '@gonasi/schemas/plugins';

import { TapToRevealCard } from './components/TapToRevealCard';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../viewPluginTypesRenderer';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';

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

  if (!canRender) return <></>;

  return (
    <ViewPluginWrapper isComplete={is_complete} playbackMode={playbackMode} mode={mode}>
      <PlayPluginWrapper>
        {/* Question */}
        <RichTextRenderer editorState={title} />
        <div>
          {cards && cards.length
            ? cards.map(({ frontContent, backContent }, index) => {
                return (
                  <TapToRevealCard
                    key={index}
                    front={<RichTextRenderer editorState={frontContent} />}
                    back={<RichTextRenderer editorState={backContent} />}
                    revealed={revealed}
                    onToggle={setRevealed}
                  />
                );
              })
            : null}
        </div>
      </PlayPluginWrapper>
      {/* <TrueOrFalseInteractionDebug interaction={interaction} /> */}
    </ViewPluginWrapper>
  );
}

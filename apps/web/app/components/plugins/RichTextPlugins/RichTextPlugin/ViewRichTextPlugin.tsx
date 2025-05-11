import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../viewPluginTypesRenderer';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { ViewPluginWrapper } from '~/components/plugins/common/ViewPluginWrapper';
import { BlockActionButton } from '~/components/ui/button';
import { ReducingProgress } from '~/components/ui/circular-progress';

export function ViewRichTextPlugin({ block, mode }: ViewPluginComponentProps) {
  const { loading, canRender, handleContinue, blockInteractionData, isLastBlock } =
    useViewPluginCore({
      blockId: block.id,
      pluginType: block.plugin_type,
      settings: block.settings,
      mode,
    });

  if (!canRender) return <></>;

  const { is_complete } = blockInteractionData ?? {};
  const { playbackMode, autoContinue, delayBeforeAutoContinue } = block.settings;

  const shouldShowActionButton = !is_complete && mode !== 'preview' && !autoContinue;
  const shouldShowProgress = !is_complete && autoContinue;

  return (
    <ViewPluginWrapper isComplete={is_complete} playbackMode={playbackMode}>
      <RichTextRenderer editorState={block.content.richTextState} />

      {shouldShowActionButton && (
        <BlockActionButton onClick={handleContinue} loading={loading} isLastBlock={isLastBlock} />
      )}

      {shouldShowProgress && <ReducingProgress time={delayBeforeAutoContinue} />}
    </ViewPluginWrapper>
  );
}

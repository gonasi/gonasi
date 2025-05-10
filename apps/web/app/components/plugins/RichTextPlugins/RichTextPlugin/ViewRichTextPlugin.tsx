import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../viewPluginTypesRenderer';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { ViewPluginWrapper } from '~/components/plugins/common/ViewPluginWrapper';

export function ViewRichTextPlugin({ block, mode }: ViewPluginComponentProps) {
  const { loading, canRender, handleContinue, blockInteractionData, isLastBlock } =
    useViewPluginCore({
      blockId: block.id,
      pluginType: block.plugin_type,
      settings: block.settings,
      mode,
    });

  if (!canRender) return null;

  return (
    <ViewPluginWrapper
      mode={mode}
      loading={loading}
      isLastBlock={isLastBlock}
      isComplete={blockInteractionData?.is_complete}
      autoContinue={block.settings.autoContinue}
      delayBeforeAutoContinue={block.settings.delayBeforeAutoContinue}
      onContinue={handleContinue}
    >
      <RichTextRenderer editorState={block.content.richTextState} />
    </ViewPluginWrapper>
  );
}

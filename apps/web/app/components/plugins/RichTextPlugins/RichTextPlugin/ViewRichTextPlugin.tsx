import type { RichTextContentSchemaType } from '@gonasi/schemas/plugins';

import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../ViewPluginTypesRenderer';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { ViewPluginWrapper } from '~/components/plugins/common/ViewPluginWrapper';
import { BlockActionButton } from '~/components/ui/button';

export function ViewRichTextPlugin({ block, mode }: ViewPluginComponentProps) {
  const { loading, canRender, handleContinue, blockInteractionData, isLastBlock } =
    useViewPluginCore({
      blockId: block.id,
      pluginType: block.plugin_type,
      settings: block.settings,
    });

  if (!canRender) return <></>;

  const { is_complete } = blockInteractionData ?? {};
  const { playbackMode } = block.settings;

  const shouldShowActionButton = !is_complete && mode !== 'preview';

  // Safely cast content to the expected structure for rich_text_editor
  const { content } = block as RichTextContentSchemaType;

  return (
    <ViewPluginWrapper isComplete={is_complete} playbackMode={playbackMode} mode={mode}>
      <RichTextRenderer editorState={content} />
      <div className='pt-4'>
        {shouldShowActionButton && (
          <BlockActionButton onClick={handleContinue} loading={loading} isLastBlock={isLastBlock} />
        )}
      </div>
    </ViewPluginWrapper>
  );
}

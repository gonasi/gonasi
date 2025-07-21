import { useEffect } from 'react';

import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../PluginRenderers/ViewPluginTypesRenderer';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { ViewPluginWrapper } from '~/components/plugins/common/ViewPluginWrapper';
import { BlockActionButton } from '~/components/ui/button';

export function ViewRichTextPlugin({ mode, blockWithProgress }: ViewPluginComponentProps) {
  const { playbackMode, weight } = blockWithProgress.block.settings;
  const { richTextState } = blockWithProgress.block.content;

  // Initialize plugin logic for play mode (progress, persistence, etc.)
  const { loading, handleContinue, updateInteractionData } = useViewPluginCore(
    mode === 'play'
      ? {
          progress: blockWithProgress.block_progress,
          blockWithProgress,
        }
      : null,
  );

  const shouldShowActionButton = mode === 'play' || !blockWithProgress.block_progress?.is_completed;

  // Set default interaction data if block progress is missing (e.g., first-time viewer)
  useEffect(() => {
    if (mode !== 'play' || blockWithProgress.block_progress) return;

    updateInteractionData({
      plugin_type: 'rich_text_editor',
      continue: true,
    });
  }, [mode, blockWithProgress.block_progress, updateInteractionData]);

  return (
    <ViewPluginWrapper
      isComplete={blockWithProgress.block_progress?.is_completed}
      playbackMode={playbackMode}
      mode={mode}
      weight={weight}
    >
      <RichTextRenderer editorState={richTextState} />

      {shouldShowActionButton && (
        <div className='pt-4'>
          <BlockActionButton
            onClick={handleContinue}
            loading={loading}
            isLastBlock={blockWithProgress.is_last_block}
          />
        </div>
      )}
    </ViewPluginWrapper>
  );
}

import { useEffect } from 'react';

import type { BuilderSchemaTypes } from '@gonasi/schemas/plugins';

import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../PluginRenderers/ViewPluginTypesRenderer';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { ViewPluginWrapper } from '~/components/plugins/common/ViewPluginWrapper';
import { BlockActionButton } from '~/components/ui/button';

type RichTextPluginType = Extract<BuilderSchemaTypes, { plugin_type: 'rich_text_editor' }>;

export function ViewRichTextPlugin({ mode, blockWithProgress }: ViewPluginComponentProps) {
  const {
    content: { richTextState },
    settings: { playbackMode, weight },
  } = blockWithProgress.block as RichTextPluginType;

  // Initialize plugin logic for play mode (progress, persistence, etc.)
  const { loading, handleContinue, updateInteractionData } = useViewPluginCore(
    mode === 'play'
      ? {
          progress: blockWithProgress.block_progress,
          blockWithProgress,
        }
      : null,
  );

  const shouldShowActionButton = mode === 'play' && !blockWithProgress.block_progress?.is_completed;

  // Set default interaction data if block progress is missing (e.g., first-time viewer)
  useEffect(() => {
    if (mode !== 'play' || blockWithProgress.block_progress) return;

    updateInteractionData({
      plugin_type: 'rich_text_editor',
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
      <div className='py-4'>
        {shouldShowActionButton && (
          <BlockActionButton
            onClick={handleContinue}
            loading={loading}
            isLastBlock={blockWithProgress.is_last_block}
          />
        )}
      </div>
    </ViewPluginWrapper>
  );
}

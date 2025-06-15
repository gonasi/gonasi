import { useEffect } from 'react';
import { useParams } from 'react-router';

import type {
  RichTextContentSchemaType,
  RichTextSettingsSchemaType,
} from '@gonasi/schemas/plugins';

import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../PluginRenderers/ViewPluginTypesRenderer';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { ViewPluginWrapper } from '~/components/plugins/common/ViewPluginWrapper';
import { BlockActionButton } from '~/components/ui/button';
import { useStore } from '~/store';

export function ViewRichTextPlugin({ block, mode }: ViewPluginComponentProps) {
  const params = useParams();

  // settings
  const { playbackMode, weight } = block.settings as RichTextSettingsSchemaType;

  // Safely cast content to the expected structure for rich_text_editor
  const { richTextState } = block.content as RichTextContentSchemaType;

  const { isLastBlock } = useStore();

  // Hook for core view plugin logic (e.g. saving state to backend)
  const { loading, payload, handleContinue, updatePayload } = useViewPluginCore(
    mode === 'play' ? block.id : null,
  );

  const shouldShowActionButton = !payload?.is_complete && mode !== 'preview';

  // Sync interaction state to payload for persistence
  useEffect(() => {
    if (mode === 'play' && updatePayload) {
      updatePayload({
        plugin_type: 'rich_text_editor',
        block_id: block.id,
        lesson_id: params.lessonId ?? '',
        score: 100,
        attempts: 1,
        state: { continue: true },
      });
    }
  }, [mode, updatePayload, block.id, params.lessonId]);

  return (
    <ViewPluginWrapper
      isComplete={payload?.is_complete}
      playbackMode={playbackMode}
      mode={mode}
      weight={weight}
    >
      <RichTextRenderer editorState={richTextState} />
      <div className='pt-4'>
        {shouldShowActionButton && (
          <BlockActionButton onClick={handleContinue} loading={loading} isLastBlock={isLastBlock} />
        )}
      </div>
    </ViewPluginWrapper>
  );
}

import type { JSX } from 'react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';

import { pluginRegistry } from '~/components/plugins';
import type { LiveSessionBlock } from '~/routes/organizations/liveSessions/session/blocks/live-sessions-blocks-index';

interface ViewLiveSessionPluginRendererProps {
  block: LiveSessionBlock;
  isLastBlock: boolean;
}

export default function ViewLiveSessionPluginRenderer({
  block,
  isLastBlock,
}: ViewLiveSessionPluginRendererProps): JSX.Element {
  const pluginType = block.plugin_type as PluginTypeId;

  if (!pluginRegistry.has(pluginType)) {
    return (
      <div className='text-muted-foreground p-4 text-sm'>
        Plugin not implemented: {block.plugin_type}
      </div>
    );
  }

  const PluginView = pluginRegistry.getView(pluginType);

  // Adapts the live session block into the BlockWithProgress shape expected by view
  // components. In the admin context, mode is always 'preview' so block_progress is unused.
  const blockWithProgress = {
    block: block as any,
    block_progress: null,
    is_active: false,
    is_visible: true,
    is_last_block: isLastBlock,
  };

  return <PluginView blockWithProgress={blockWithProgress} />;
}

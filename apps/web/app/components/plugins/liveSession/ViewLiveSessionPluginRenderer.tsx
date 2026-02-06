import type { JSX } from 'react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';

import { liveSessionPluginRegistry } from '~/components/plugins/liveSession';
import { DefaultLiveSessionView } from '~/components/plugins/liveSession/LiveSessionViews';
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

  // Try to get the live session-specific view component
  const LiveView = liveSessionPluginRegistry.getView(pluginType);

  // If no live view component is registered, use the default fallback
  if (!LiveView) {
    return <DefaultLiveSessionView block={block} isLastBlock={isLastBlock} />;
  }

  return <LiveView block={block} isLastBlock={isLastBlock} />;
}

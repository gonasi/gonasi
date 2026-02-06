import type { ComponentType, ReactElement } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { LucideIcon } from 'lucide-react';
import type { ZodSchema } from 'zod';

import type { LivePluginBlockId } from '~/routes/organizations/liveSessions/constants/live-plugin-blocks';
import type { LiveSessionBlock } from '~/routes/organizations/liveSessions/session/blocks/live-sessions-blocks-index';

export interface LiveSessionPluginMetadata {
  name: string;
  description: string;
  icon: LucideIcon;
}

export interface LiveSessionFieldsRenderProps {
  methods: UseFormReturn<any>;
}

/**
 * Props for live session view components
 * Different from regular course block views - tailored for real-time interaction
 */
export interface LiveSessionViewComponentProps {
  block: LiveSessionBlock;
  isLastBlock: boolean;
  // Future: add instructor controls, real-time stats, etc.
}

/**
 * Complete plugin definition — passed to createLiveSessionPlugin
 * and stored in the registry.
 *
 * Mirrors PluginFactoryConfig from the course plugin system, scoped
 * to what live session block editors actually need.
 */
export interface LiveSessionPluginDefinition {
  pluginType: LivePluginBlockId;
  metadata: LiveSessionPluginMetadata;
  schema: ZodSchema;
  defaults: {
    content: Record<string, unknown>;
    settings: Record<string, unknown>;
    difficulty: 'easy' | 'medium' | 'hard';
    time_limit: number;
  };
  /** Renders the plugin-specific content fields inside the form body. */
  renderFields: (props: LiveSessionFieldsRenderProps) => ReactElement;
  /** Renders plugin-specific settings fields inside the shared settings popover. */
  renderSettings?: (props: LiveSessionFieldsRenderProps) => ReactElement;
  /** View component for rendering the block in a live session (optional) */
  ViewComponent?: ComponentType<LiveSessionViewComponentProps>;
}

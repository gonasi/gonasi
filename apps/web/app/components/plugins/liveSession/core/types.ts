import type { ComponentType, ReactElement } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { LucideIcon } from 'lucide-react';
import type { ZodSchema } from 'zod';

import type { LiveSessionBlock } from '@gonasi/database/liveSessions';

import type { LiveSessionPluginBlockId } from '~/routes/organizations/liveSessions/constants/live-plugin-blocks';

export interface LiveSessionPluginMetadata {
  name: string;
  description: string;
  icon: LucideIcon;
}

export interface LiveSessionFieldsRenderProps {
  methods: UseFormReturn<any>;
}

/**
 * Mode for live session components
 * - test: Facilitators testing the session (no DB writes, real experience)
 * - live: Actual participants in a live session (DB writes, real-time sync)
 */
export type LiveSessionMode = 'test' | 'live';

/**
 * Props for live session view components (static preview)
 * Used for displaying blocks in the builder/preview mode
 */
export interface LiveSessionViewComponentProps {
  block: LiveSessionBlock;
  isLastBlock: boolean;
}

/**
 * Props for live session play components (interactive)
 * Used when actually playing the session (test or live mode)
 */
export interface LiveSessionPlayComponentProps {
  block: LiveSessionBlock;
  isLastBlock: boolean;
  mode: LiveSessionMode;
  // Future: add session context, real-time handlers, etc.
}

/**
 * Complete plugin definition — passed to createLiveSessionPlugin
 * and stored in the registry.
 *
 * Mirrors PluginFactoryConfig from the course plugin system, scoped
 * to what live session block editors actually need.
 */
export interface LiveSessionPluginDefinition {
  pluginType: LiveSessionPluginBlockId;
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
  /** View component for static preview/display (optional) */
  ViewComponent?: ComponentType<LiveSessionViewComponentProps>;
  /** Play component for interactive gameplay with test/live modes (optional) */
  PlayComponent?: ComponentType<LiveSessionPlayComponentProps>;
}

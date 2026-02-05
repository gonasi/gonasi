import type { ReactElement } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { LucideIcon } from 'lucide-react';
import type { ZodSchema } from 'zod';

export interface LiveSessionPluginMetadata {
  name: string;
  description: string;
  icon: LucideIcon;
}

export interface LiveSessionFieldsRenderProps {
  methods: UseFormReturn<any>;
}

/**
 * Complete plugin definition — passed to createLiveSessionPlugin
 * and stored in the registry.
 *
 * Mirrors PluginFactoryConfig from the course plugin system, scoped
 * to what live session block editors actually need.
 */
export interface LiveSessionPluginDefinition {
  pluginType: string;
  metadata: LiveSessionPluginMetadata;
  schema: ZodSchema;
  defaults: {
    content: Record<string, unknown>;
    settings: Record<string, unknown>;
    weight: number;
    time_limit: number;
  };
  /** Renders the plugin-specific content fields inside the form body. */
  renderFields: (props: LiveSessionFieldsRenderProps) => ReactElement;
  /** Renders plugin-specific settings fields inside the shared settings popover. */
  renderSettings?: (props: LiveSessionFieldsRenderProps) => ReactElement;
}

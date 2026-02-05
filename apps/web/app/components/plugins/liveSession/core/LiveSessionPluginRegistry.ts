import type { LiveSessionPluginDefinition } from './types';

/**
 * Singleton registry for live session block plugins.
 *
 * Mirrors the course-level PluginRegistry pattern — each plugin
 * self-registers via createLiveSessionPlugin on import.
 *
 * Usage:
 *   import { liveSessionPluginRegistry } from '~/components/plugins/liveSession';
 *
 *   const plugin = liveSessionPluginRegistry.get('true_or_false');
 */
class LiveSessionPluginRegistry {
  private static instance: LiveSessionPluginRegistry;
  private plugins = new Map<string, LiveSessionPluginDefinition>();

  private constructor() {}

  static getInstance(): LiveSessionPluginRegistry {
    if (!LiveSessionPluginRegistry.instance) {
      LiveSessionPluginRegistry.instance = new LiveSessionPluginRegistry();
    }
    return LiveSessionPluginRegistry.instance;
  }

  /** Called automatically by createLiveSessionPlugin. */
  register(definition: LiveSessionPluginDefinition): void {
    if (this.plugins.has(definition.pluginType)) {
      console.warn(
        `LiveSession plugin "${definition.pluginType}" already registered. Overwriting...`,
      );
    }
    this.plugins.set(definition.pluginType, definition);
  }

  get(pluginType: string): LiveSessionPluginDefinition | undefined {
    return this.plugins.get(pluginType);
  }

  has(pluginType: string): boolean {
    return this.plugins.has(pluginType);
  }

  getAllPlugins(): LiveSessionPluginDefinition[] {
    return Array.from(this.plugins.values());
  }
}

export const liveSessionPluginRegistry = LiveSessionPluginRegistry.getInstance();
export { LiveSessionPluginRegistry };

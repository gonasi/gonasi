import { liveSessionPluginRegistry } from './LiveSessionPluginRegistry';
import type { LiveSessionPluginDefinition } from './types';

/**
 * Factory for live session block plugins.
 *
 * Accepts a plugin definition, auto-registers it in the singleton
 * registry, and returns the definition for optional direct use.
 *
 * Adding a new block type is two steps:
 *   1. Call createLiveSessionPlugin(...) in its own module.
 *   2. Import that module in the liveSession barrel (index.ts).
 *
 * No manual wiring in route files or action handlers is needed.
 */
export function createLiveSessionPlugin(
  config: LiveSessionPluginDefinition,
): LiveSessionPluginDefinition {
  liveSessionPluginRegistry.register(config);
  return config;
}

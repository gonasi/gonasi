/**
 * Core Plugin Architecture
 *
 * This module provides the foundational abstractions for the plugin system:
 * - PluginRegistry: Singleton registry for managing all plugins
 * - PluginFactory: Factory function for creating plugins
 * - Hooks: Reusable hooks for builder and view components
 * - Types: TypeScript interfaces and types
 *
 * Usage:
 * ```typescript
 * import { createPlugin } from './core';
 *
 * export const MyPlugin = createPlugin({
 *   pluginType: 'my_plugin',
 *   // ... configuration
 * });
 * ```
 */

// Registry
export { pluginRegistry, PluginRegistry } from './PluginRegistry';

// Factory
export { createPlugin } from './PluginFactory.tsx';

// Hooks
export { usePluginBuilder } from './usePluginBuilder';
export type { UsePluginBuilderOptions } from './usePluginBuilder';

export { usePluginView } from './usePluginView';
export type { UsePluginViewOptions } from './usePluginView';

// Types
export type {
  PluginDefinition,
  PluginFactoryConfig,
  PluginMetadata,
  ScoreCalculator,
  MigrationFunction,
  InteractionHook,
  InteractionHookReturn,
  BuilderRenderProps,
  SettingsRenderProps,
  ViewRenderProps,
  BuilderComponentProps,
  ViewComponentProps,
  PluginBuilderHookReturn,
  PluginViewHookReturn,
} from './types';

import type { ComponentType, LazyExoticComponent } from 'react';

import type { PluginTypeId } from '@gonasi/schemas/plugins';

import type { BuilderComponentProps, PluginDefinition, ViewComponentProps } from './types';

/**
 * Singleton registry for managing all plugin definitions
 *
 * This class implements the Singleton pattern to ensure there's only one
 * source of truth for plugin registration throughout the application.
 *
 * Benefits:
 * - Centralized plugin management
 * - Type-safe plugin retrieval
 * - Auto-registration via factory pattern
 * - No manual renderer updates required
 *
 * Usage:
 * ```typescript
 * import { pluginRegistry } from './PluginRegistry';
 *
 * // Get plugin definition
 * const plugin = pluginRegistry.get('true_or_false');
 *
 * // Get builder component
 * const Builder = pluginRegistry.getBuilder('true_or_false');
 *
 * // Get view component
 * const View = pluginRegistry.getView('true_or_false');
 * ```
 */
class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins = new Map<PluginTypeId, PluginDefinition<any, any, any>>();

  /**
   * Private constructor ensures singleton pattern
   */
  private constructor() {
    // Initialize empty registry
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  /**
   * Register a plugin definition
   * Called automatically by createPlugin factory
   */
  register(definition: PluginDefinition<any, any, any>): void {
    if (this.plugins.has(definition.pluginType)) {
      console.warn(`Plugin "${definition.pluginType}" is already registered. Overwriting...`);
    }
    this.plugins.set(definition.pluginType, definition);
  }

  /**
   * Get a plugin definition by type ID
   */
  get(pluginType: PluginTypeId): PluginDefinition<any, any, any> | undefined {
    return this.plugins.get(pluginType);
  }

  /**
   * Get builder component for a plugin type
   * Throws error if plugin not registered
   */
  getBuilder(pluginType: PluginTypeId): LazyExoticComponent<ComponentType<BuilderComponentProps>> {
    const plugin = this.get(pluginType);
    if (!plugin) {
      throw new Error(
        `Plugin "${pluginType}" not registered. Did you forget to import it in the plugins index?`,
      );
    }
    return plugin.components.Builder;
  }

  /**
   * Get view component for a plugin type
   * Throws error if plugin not registered
   */
  getView(pluginType: PluginTypeId): ComponentType<ViewComponentProps> {
    const plugin = this.get(pluginType);
    if (!plugin) {
      throw new Error(
        `Plugin "${pluginType}" not registered. Did you forget to import it in the plugins index?`,
      );
    }
    return plugin.components.View;
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): PluginDefinition<any, any, any>[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all registered plugin type IDs
   */
  getPluginTypes(): PluginTypeId[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Check if a plugin is registered
   */
  has(pluginType: PluginTypeId): boolean {
    return this.plugins.has(pluginType);
  }

  /**
   * Get number of registered plugins
   */
  size(): number {
    return this.plugins.size;
  }

  /**
   * Clear all plugins (useful for testing)
   * @internal
   */
  clear(): void {
    this.plugins.clear();
  }

  /**
   * Unregister a plugin (useful for testing)
   * @internal
   */
  unregister(pluginType: PluginTypeId): boolean {
    return this.plugins.delete(pluginType);
  }
}

/**
 * Singleton instance export
 * Import this in your code to access the registry
 */
export const pluginRegistry = PluginRegistry.getInstance();

/**
 * Export the class for testing purposes
 * @internal
 */
export { PluginRegistry };

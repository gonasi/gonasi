/**
 * Plugin Registry - Central Import Point
 *
 * This file imports all refactored plugins to trigger their auto-registration
 * in the singleton PluginRegistry.
 *
 * When a plugin is imported, the createPlugin factory automatically registers
 * it with the pluginRegistry, making it available throughout the app.
 *
 * Usage in renderers:
 * ```typescript
 * import { pluginRegistry } from '@/components/plugins';
 * const Builder = pluginRegistry.getBuilder('true_or_false');
 * const View = pluginRegistry.getView('true_or_false');
 * ```
 */

// Import refactored plugins to trigger auto-registration
import './QuizPlugins/TrueOrFalsePlugin';
import './QuizPlugins/MultipleChoiceSingleAnswer';
import './QuizPlugins/MultipleChoiceMultipleAnswers';
import './QuizPlugins/FillInTheBlankPlugin';
import './QuizPlugins/MatchingGamePlugin';
import './QuizPlugins/SwipeCategorizePlugin';
// All quiz plugins have been refactored!

// Re-export the registry and core utilities
export { pluginRegistry } from './core/PluginRegistry';
export { createPlugin } from './core/PluginFactory.tsx';
export { usePluginBuilder, usePluginView } from './core';
export type { PluginDefinition } from './core/types';

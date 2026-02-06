// Import all plugins — this triggers self-registration via createLiveSessionPlugin.
// Adding a new block type: create its module, then add an import here.
import './TrueOrFalse';

export { liveSessionPluginRegistry } from './core/LiveSessionPluginRegistry';
export { createLiveSessionPlugin } from './core/createLiveSessionPlugin';
export { LiveSessionBlockFormWrapper } from './core/LiveSessionBlockFormWrapper';
export type {
  LiveSessionPluginDefinition,
  LiveSessionPluginMetadata,
  LiveSessionViewComponentProps,
} from './core/types';

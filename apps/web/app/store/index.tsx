import { create } from 'zustand';

import type { PluginId, PluginTypeId } from '~/components/plugins/pluginData';

interface StoreState {
  // Plugins
  activePlugin: PluginId | null;
  activeSubPlugin: PluginTypeId | null;
  updateActivePlugin: (plugin: PluginId | null) => void;
  updateActiveSubPlugin: (plugin: PluginTypeId | null) => void;
}

export const useStore = create<StoreState>((set) => ({
  // Plugins
  activePlugin: null,
  activeSubPlugin: null,
  updateActivePlugin: (pluginId) => set({ activePlugin: pluginId }),
  updateActiveSubPlugin: (pluginSubId) => set({ activeSubPlugin: pluginSubId }),
}));

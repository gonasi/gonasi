import { useMemo } from 'react';

import type { Plugin, PluginCategory } from '@gonasi/schemas/plugins';
import { ALL_PLUGINS } from '@gonasi/schemas/plugins';

export const usePluginOptions = (searchQuery = ''): PluginCategory[] => {
  const data = useMemo<PluginCategory[]>(
    () =>
      ALL_PLUGINS.map(
        (category): PluginCategory => ({
          ...category,
          plugins: category.plugins.map(
            (plugin): Plugin => ({
              ...plugin,
              pluginTypes: [...plugin.pluginTypes],
            }),
          ),
        }),
      ),
    [],
  );

  return useMemo(() => {
    const query = searchQuery.toLowerCase();

    return data
      .map((category) => {
        const filteredPlugins = category.plugins.filter((plugin) => {
          if (!query) return true;

          const matchesPluginText =
            plugin.name.toLowerCase().includes(query) ||
            plugin.description.toLowerCase().includes(query);

          const matchesPluginType = plugin.pluginTypes?.some(
            (type) =>
              type.name.toLowerCase().includes(query) ||
              type.description.toLowerCase().includes(query),
          );

          return matchesPluginText || matchesPluginType;
        });

        return {
          ...category,
          plugins: filteredPlugins,
        };
      })
      .filter((category) => category.plugins.length > 0);
  }, [data, searchQuery]);
};

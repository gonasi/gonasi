import { useMemo } from 'react';

import type { Plugin, PluginGroup } from '@gonasi/schemas/plugins';
import { ALL_PLUGINS } from '@gonasi/schemas/plugins';

export const usePluginOptions = (searchQuery = ''): PluginGroup[] => {
  const data = useMemo<PluginGroup[]>(
    () =>
      ALL_PLUGINS.map(
        (category): PluginGroup => ({
          ...category,
          pluginGroups: category.pluginGroups.map(
            (pluginGroup): Plugin => ({
              ...pluginGroup,
              pluginTypes: [...pluginGroup.pluginTypes],
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
        const filteredPlugins = category.pluginGroups.filter((pluginGroup) => {
          if (!query) return true;

          const matchesPluginText =
            pluginGroup.name.toLowerCase().includes(query) ||
            pluginGroup.description.toLowerCase().includes(query);

          const matchesPluginType = pluginGroup.pluginTypes?.some(
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

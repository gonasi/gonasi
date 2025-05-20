import { useMemo } from 'react';

import type { Category, PluginGroup } from '@gonasi/schemas/pluginsConfig';
import { ALL_PLUGINS } from '@gonasi/schemas/pluginsConfig';

/**
 * Hook to get a filtered list of plugin categories based on a search query.
 *
 * @param searchQuery - A string used to filter plugin types by name or description.
 * @returns A filtered list of plugin categories and their plugin groups/types.
 */
export const usePluginOptions = (searchQuery = ''): Category[] => {
  // useMemo ensures this mapping only happens once since ALL_PLUGINS is static.
  // It deep clones the data structure to ensure reactivity/safety when reused.
  const data = useMemo<Category[]>(
    () =>
      ALL_PLUGINS.map((category) => ({
        ...category,
        pluginGroups: category.pluginGroups.map((group) => ({
          ...group,
          pluginTypes: [...group.pluginTypes], // shallow clone to prevent mutation
        })),
      })),
    [], // Runs only once on mount
  );

  // Filters plugin types and groups based on the search query.
  return useMemo(() => {
    const query = searchQuery.toLowerCase(); // normalize query for case-insensitive matching

    return (
      data
        .map((category) => {
          // Filter plugin groups within each category
          const filteredGroups = category.pluginGroups
            .map((group): PluginGroup => {
              // Filter plugin types in the group that match the query
              const filteredTypes = group.pluginTypes.filter((type) => {
                if (!query) return true; // if no query, include all

                return (
                  type.name.toLowerCase().includes(query) ||
                  type.description.toLowerCase().includes(query)
                );
              });

              // Return the group with only matching plugin types
              return { ...group, pluginTypes: filteredTypes };
            })
            // Only include groups that still have matching plugin types
            .filter((group) => group.pluginTypes.length > 0);

          // Return the category with filtered plugin groups
          return {
            ...category,
            pluginGroups: filteredGroups,
          };
        })
        // Only include categories that have plugin groups left after filtering
        .filter((category) => category.pluginGroups.length > 0)
    );
  }, [data, searchQuery]); // recompute when data or query changes
};

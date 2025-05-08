import { create } from 'zustand';

import type { PluginId, PluginTypeId } from '@gonasi/schemas/plugins';

import type {
  GoLessonPlayInteractionReturnType,
  GoLessonPlayLessonBlocksType,
} from '~/routes/go/go-lesson-play';

interface StoreState {
  activePlugin: PluginId | null;
  activeSubPlugin: PluginTypeId | null;
  updateActivePlugin: (plugin: PluginId | null) => void;
  updateActiveSubPlugin: (subPlugin: PluginTypeId | null) => void;

  lessonBlocks: GoLessonPlayLessonBlocksType;
  lessonBlockInteractions: GoLessonPlayInteractionReturnType;
  visibleBlocks: GoLessonPlayLessonBlocksType;

  setCurrentLessonBlocks: (lessonBlocks: GoLessonPlayLessonBlocksType) => void;
  setLessonBlockInteractions: (interactions: GoLessonPlayInteractionReturnType) => void;

  initializePlayFlow: (
    lesson: GoLessonPlayLessonBlocksType,
    interactions: GoLessonPlayInteractionReturnType,
  ) => void;

  resetPlayFlow: () => void;
}

export const useStore = create<StoreState>((set) => ({
  activePlugin: null,
  activeSubPlugin: null,
  updateActivePlugin: (pluginId) => set({ activePlugin: pluginId }),
  updateActiveSubPlugin: (subPluginId) => set({ activeSubPlugin: subPluginId }),

  lessonBlocks: [],
  lessonBlockInteractions: [],
  visibleBlocks: [],

  setCurrentLessonBlocks: (lessonBlocks) => set({ lessonBlocks }),
  setLessonBlockInteractions: (interactions) => set({ lessonBlockInteractions: interactions }),

  initializePlayFlow: (lesson, interactions) => {
    const sortedBlocks = [...lesson].sort((a, b) => a.position - b.position);

    const visibleBlockIds = new Set(
      sortedBlocks
        .filter((block) => {
          if (block.position === 0) return true;

          const prev = sortedBlocks.find((b) => b.position === block.position - 1);
          if (!prev) return false;

          return interactions.some((i) => i.block_id === prev.id && i.is_complete);
        })
        .map((block) => block.id),
    );

    set({
      lessonBlocks: sortedBlocks,
      lessonBlockInteractions: interactions,
      visibleBlocks: sortedBlocks.filter((block) => visibleBlockIds.has(block.id)),
    });
  },

  resetPlayFlow: () =>
    set({
      lessonBlocks: [],
      lessonBlockInteractions: [],
      visibleBlocks: [],
    }),
}));

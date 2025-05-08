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
  lessonProgress: number | 0;

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
  lessonProgress: 0,

  setCurrentLessonBlocks: (lessonBlocks) =>
    set((state) => {
      const completedBlockIds = new Set(
        state.lessonBlockInteractions.filter((i) => i.is_complete).map((i) => i.block_id),
      );

      const totalWeight = lessonBlocks.reduce((sum, b) => sum + (b.weight || 0), 0);
      const completedWeight = lessonBlocks
        .filter((b) => completedBlockIds.has(b.id))
        .reduce((sum, b) => sum + (b.weight || 0), 0);

      const lessonProgress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

      return { lessonBlocks, lessonProgress };
    }),

  setLessonBlockInteractions: (interactions) =>
    set((state) => {
      const completedBlockIds = new Set(
        interactions.filter((i) => i.is_complete).map((i) => i.block_id),
      );

      const totalWeight = state.lessonBlocks.reduce((sum, b) => sum + (b.weight || 0), 0);
      const completedWeight = state.lessonBlocks
        .filter((b) => completedBlockIds.has(b.id))
        .reduce((sum, b) => sum + (b.weight || 0), 0);

      const lessonProgress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

      return {
        lessonBlockInteractions: interactions,
        lessonProgress,
      };
    }),

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

    const completedBlockIds = new Set(
      interactions.filter((i) => i.is_complete).map((i) => i.block_id),
    );

    const totalWeight = sortedBlocks.reduce((sum, b) => sum + (b.weight || 0), 0);
    const completedWeight = sortedBlocks
      .filter((b) => completedBlockIds.has(b.id))
      .reduce((sum, b) => sum + (b.weight || 0), 0);

    const lessonProgress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

    set({
      lessonBlocks: sortedBlocks,
      lessonBlockInteractions: interactions,
      visibleBlocks: sortedBlocks.filter((block) => visibleBlockIds.has(block.id)),
      lessonProgress,
    });
  },

  resetPlayFlow: () =>
    set({
      lessonBlocks: [],
      lessonBlockInteractions: [],
      visibleBlocks: [],
      lessonProgress: 0,
    }),
}));

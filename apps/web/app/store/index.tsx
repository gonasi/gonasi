import { create } from 'zustand';

import type { PluginId, PluginTypeId } from '@gonasi/schemas/plugins';

import type {
  GoLessonPlayInteractionReturnType,
  GoLessonPlayLessonBlocksType,
} from '~/routes/go/go-lesson-play';

/**
 * Core store state interface for lesson flow management
 * Handles plugin selection, lesson blocks, interactions, and progress tracking
 */
interface StoreState {
  // Plugin management
  activePlugin: PluginId | null;
  activeSubPlugin: PluginTypeId | null;
  updateActivePlugin: (plugin: PluginId | null) => void;
  updateActiveSubPlugin: (subPlugin: PluginTypeId | null) => void;

  // Lesson state
  lessonBlocks: GoLessonPlayLessonBlocksType;
  lessonBlockInteractions: GoLessonPlayInteractionReturnType;
  visibleBlocks: GoLessonPlayLessonBlocksType;
  lessonProgress: number;

  // Computed properties
  activeBlock: string | null;

  // Actions
  setCurrentLessonBlocks: (lessonBlocks: GoLessonPlayLessonBlocksType) => void;
  setLessonBlockInteractions: (interactions: GoLessonPlayInteractionReturnType) => void;
  initializePlayFlow: (
    lesson: GoLessonPlayLessonBlocksType,
    interactions: GoLessonPlayInteractionReturnType,
  ) => void;
  resetPlayFlow: () => void;

  // Selectors
  getBlockInteraction: (blockId: string) => GoLessonPlayInteractionReturnType[number] | undefined;
}

/**
 * Calculate lesson progress based on completed blocks and their weights
 */
const calculateProgress = (
  blocks: GoLessonPlayLessonBlocksType,
  completedBlockIds: Set<string>,
): number => {
  const totalWeight = blocks.reduce((sum, block) => sum + (block.weight || 0), 0);
  if (totalWeight === 0) return 0;

  const completedWeight = blocks
    .filter((block) => completedBlockIds.has(block.id))
    .reduce((sum, block) => sum + (block.weight || 0), 0);

  return (completedWeight / totalWeight) * 100;
};

/**
 * Creates a set of completed block IDs from interactions
 */
const getCompletedBlockIds = (interactions: GoLessonPlayInteractionReturnType): Set<string> =>
  new Set(interactions.filter((i) => i.is_complete).map((i) => i.block_id));

/**
 * Compute visible blocks based on lesson blocks and completed interactions
 */
const computeVisibleBlocks = (
  lessonBlocks: GoLessonPlayLessonBlocksType,
  interactions: GoLessonPlayInteractionReturnType,
): GoLessonPlayLessonBlocksType => {
  // Sort blocks by position for consistent processing
  const sortedBlocks = [...lessonBlocks].sort((a, b) => a.position - b.position);

  return sortedBlocks.filter((block) => {
    // First block is always visible
    if (block.position === 0) return true;

    // Find the previous block
    const prevBlock = sortedBlocks.find((b) => b.position === block.position - 1);
    if (!prevBlock) return false;

    // Block is visible if previous block is completed
    return interactions.some((i) => i.block_id === prevBlock.id && i.is_complete);
  });
};

/**
 * Helper function to compute the active block based on visible blocks
 */
const computeActiveBlock = (visibleBlocks: GoLessonPlayLessonBlocksType): string | null => {
  return visibleBlocks.length > 0 ? (visibleBlocks[visibleBlocks.length - 1]?.id ?? null) : null;
};

export const useStore = create<StoreState>((set, get) => ({
  // Initial plugin state
  activePlugin: null,
  activeSubPlugin: null,
  updateActivePlugin: (pluginId) => set({ activePlugin: pluginId }),
  updateActiveSubPlugin: (subPluginId) => set({ activeSubPlugin: subPluginId }),

  // Initial lesson state
  lessonBlocks: [],
  lessonBlockInteractions: [],
  visibleBlocks: [],
  lessonProgress: 0,
  activeBlock: null,

  /**
   * Updates lesson blocks and recalculates derived state
   */
  setCurrentLessonBlocks: (lessonBlocks) =>
    set((state) => {
      try {
        const completedBlockIds = getCompletedBlockIds(state.lessonBlockInteractions);
        const updatedVisibleBlocks = computeVisibleBlocks(
          lessonBlocks,
          state.lessonBlockInteractions,
        );

        return {
          lessonBlocks,
          lessonProgress: calculateProgress(lessonBlocks, completedBlockIds),
          visibleBlocks: updatedVisibleBlocks,
          activeBlock: computeActiveBlock(updatedVisibleBlocks),
        };
      } catch (error) {
        console.error('Error setting lesson blocks:', error);
        return {}; // Return empty object to prevent state changes on error
      }
    }),

  /**
   * Updates interactions and recalculates derived state
   */
  setLessonBlockInteractions: (interactions) =>
    set((state) => {
      try {
        const completedBlockIds = getCompletedBlockIds(interactions);
        const updatedVisibleBlocks = computeVisibleBlocks(state.lessonBlocks, interactions);

        return {
          lessonBlockInteractions: interactions,
          lessonProgress: calculateProgress(state.lessonBlocks, completedBlockIds),
          visibleBlocks: updatedVisibleBlocks,
          activeBlock: computeActiveBlock(updatedVisibleBlocks),
        };
      } catch (error) {
        console.error('Error setting lesson block interactions:', error);
        return {}; // Return empty object to prevent state changes on error
      }
    }),

  /**
   * Initializes the lesson flow with blocks and interactions
   */
  initializePlayFlow: (lesson, interactions) => {
    try {
      // Sort blocks by position for consistent processing
      const sortedBlocks = [...lesson].sort((a, b) => a.position - b.position);
      const completedBlockIds = getCompletedBlockIds(interactions);
      const visibleBlocks = computeVisibleBlocks(sortedBlocks, interactions);

      set({
        lessonBlocks: sortedBlocks,
        lessonBlockInteractions: interactions,
        visibleBlocks,
        lessonProgress: calculateProgress(sortedBlocks, completedBlockIds),
        activeBlock: computeActiveBlock(visibleBlocks),
      });
    } catch (error) {
      console.error('Error initializing play flow:', error);
    }
  },

  /**
   * Resets all lesson state
   */
  resetPlayFlow: () =>
    set({
      lessonBlocks: [],
      lessonBlockInteractions: [],
      visibleBlocks: [],
      lessonProgress: 0,
      activeBlock: null,
    }),

  /**
   * Selector: Gets the block interaction for a specific block ID
   */
  getBlockInteraction: (blockId) =>
    get().lessonBlockInteractions.find((interaction) => interaction.block_id === blockId),
}));

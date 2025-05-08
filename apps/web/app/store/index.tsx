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
  isLoading: boolean;

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
  activeBlock: () => string | null;
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
  isLoading: false,

  /**
   * Updates lesson blocks and recalculates progress
   */
  setCurrentLessonBlocks: (lessonBlocks) =>
    set((state) => {
      set({ isLoading: true });

      try {
        const completedBlockIds = getCompletedBlockIds(state.lessonBlockInteractions);
        const lessonProgress = calculateProgress(lessonBlocks, completedBlockIds);

        return { lessonBlocks, lessonProgress, isLoading: false };
      } catch (error) {
        console.error('Error setting lesson blocks:', error);
        return { isLoading: false };
      }
    }),

  /**
   * Updates interactions and recalculates progress
   */
  setLessonBlockInteractions: (interactions) =>
    set((state) => {
      set({ isLoading: true });

      try {
        const completedBlockIds = getCompletedBlockIds(interactions);
        const lessonProgress = calculateProgress(state.lessonBlocks, completedBlockIds);

        return {
          lessonBlockInteractions: interactions,
          lessonProgress,
          isLoading: false,
        };
      } catch (error) {
        console.error('Error setting lesson block interactions:', error);
        return { isLoading: false };
      }
    }),

  /**
   * Initializes the lesson flow with blocks and interactions
   * Determines which blocks should be visible based on completion status
   */
  initializePlayFlow: (lesson, interactions) => {
    // Set loading state to true before processing starts
    set({ isLoading: true });

    try {
      // Sort blocks by position for consistent processing
      const sortedBlocks = [...lesson].sort((a, b) => a.position - b.position);
      const completedBlockIds = getCompletedBlockIds(interactions);

      // Determine visible blocks (first block + blocks after completed blocks)
      const visibleBlocks = sortedBlocks.filter((block) => {
        // First block is always visible
        if (block.position === 0) return true;

        // Find the previous block
        const prevBlock = sortedBlocks.find((b) => b.position === block.position - 1);
        if (!prevBlock) return false;

        // Block is visible if previous block is completed
        return completedBlockIds.has(prevBlock.id);
      });

      const lessonProgress = calculateProgress(sortedBlocks, completedBlockIds);

      set({
        lessonBlocks: sortedBlocks,
        lessonBlockInteractions: interactions,
        visibleBlocks,
        lessonProgress,
        isLoading: false, // Set loading to false after processing completes
      });
    } catch (error) {
      // Ensure loading state is reset even if there's an error
      console.error('Error initializing play flow:', error);
      set({ isLoading: false });
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
      isLoading: false,
    }),

  /**
   * Finds interaction for a specific block
   */
  getBlockInteraction: (blockId) =>
    get().lessonBlockInteractions.find((interaction) => interaction.block_id === blockId),

  /**
   * Returns ID of the last visible block (current active block)
   */
  activeBlock: () => {
    const visible = get().visibleBlocks;
    // Use optional chaining and nullish coalescing to handle potentially undefined values
    return visible && visible.length > 0 ? (visible[visible.length - 1]?.id ?? null) : null;
  },
}));

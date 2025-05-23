import { create } from 'zustand';

import type { UserActiveSessionLoaderReturnType } from '~/root';
import type {
  GoLessonPlayInteractionReturnType,
  GoLessonPlayLessonBlocksType,
} from '~/routes/go/go-lesson-play';

/**
 * Defines the shape of the Zustand store.
 */
interface StoreState {
  activeSession: UserActiveSessionLoaderReturnType;
  updateActiveSession: (session: UserActiveSessionLoaderReturnType) => void;

  // Lesson state
  lessonBlocks: GoLessonPlayLessonBlocksType;
  lessonBlockInteractions: GoLessonPlayInteractionReturnType;
  visibleBlocks: GoLessonPlayLessonBlocksType;
  lessonProgress: number;

  // Computed properties
  activeBlock: string | null;
  isLastBlock: boolean;

  // Explanation bottom sheet state
  isExplanationBottomSheetOpen: boolean;
  storeExplanationState: string | null;
  setExplanationState: (state: string | null) => void;
  closeExplanation: () => void;

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
 * Calculates the lesson completion percentage based on block weights.
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
 * Extracts the IDs of all completed lesson blocks from interactions.
 */
const getCompletedBlockIds = (interactions: GoLessonPlayInteractionReturnType): Set<string> =>
  new Set(interactions.filter((i) => i.is_complete).map((i) => i.block_id));

/**
 * Determines which lesson blocks should be visible based on interaction history.
 */
const computeVisibleBlocks = (
  lessonBlocks: GoLessonPlayLessonBlocksType,
  interactions: GoLessonPlayInteractionReturnType,
): GoLessonPlayLessonBlocksType => {
  const sortedBlocks = [...lessonBlocks].sort((a, b) => a.position - b.position);

  return sortedBlocks.filter((block) => {
    if (block.position === 0) return true;

    const prevBlock = sortedBlocks.find((b) => b.position === block.position - 1);
    if (!prevBlock) return false;

    return interactions.some((i) => i.block_id === prevBlock.id && i.is_complete);
  });
};

/**
 * Returns the ID of the last visible block (i.e., the "active" block).
 */
const computeActiveBlock = (visibleBlocks: GoLessonPlayLessonBlocksType): string | null => {
  return visibleBlocks.length > 0 ? (visibleBlocks[visibleBlocks.length - 1]?.id ?? null) : null;
};

/**
 * Checks whether the current active block is the last in the lesson.
 */
const checkIsLastBlock = (
  activeBlockId: string | null,
  lessonBlocks: GoLessonPlayLessonBlocksType,
): boolean => {
  if (!activeBlockId || lessonBlocks.length === 0) return false;

  const sortedBlocks = [...lessonBlocks].sort((a, b) => a.position - b.position);
  const lastBlock = sortedBlocks[sortedBlocks.length - 1];

  return activeBlockId === lastBlock?.id;
};

/**
 * Zustand store implementation
 */
export const useStore = create<StoreState>((set, get) => ({
  // User session
  activeSession: null,
  updateActiveSession: (session) => set({ activeSession: session }),

  // Lesson state
  lessonBlocks: [],
  lessonBlockInteractions: [],
  visibleBlocks: [],
  lessonProgress: 0,
  activeBlock: null,
  isLastBlock: false,

  // Bottom sheet state for explanations
  isExplanationBottomSheetOpen: false,
  storeExplanationState: null,
  setExplanationState: (state) =>
    set({
      storeExplanationState: state,
      isExplanationBottomSheetOpen: state !== null,
    }),
  closeExplanation: () =>
    set({
      storeExplanationState: null,
      isExplanationBottomSheetOpen: false,
    }),

  /**
   * Updates lesson blocks and recomputes visibility, progress, and active block.
   */
  setCurrentLessonBlocks: (lessonBlocks) =>
    set((state) => {
      try {
        const completedBlockIds = getCompletedBlockIds(state.lessonBlockInteractions);
        const updatedVisibleBlocks = computeVisibleBlocks(
          lessonBlocks,
          state.lessonBlockInteractions,
        );
        const newActiveBlock = computeActiveBlock(updatedVisibleBlocks);

        return {
          lessonBlocks,
          lessonProgress: calculateProgress(lessonBlocks, completedBlockIds),
          visibleBlocks: updatedVisibleBlocks,
          activeBlock: newActiveBlock,
          isLastBlock: checkIsLastBlock(newActiveBlock, lessonBlocks),
        };
      } catch (error) {
        console.error('Error setting lesson blocks:', error);
        return {};
      }
    }),

  /**
   * Updates interaction state and recomputes visibility, progress, and active block.
   */
  setLessonBlockInteractions: (interactions) =>
    set((state) => {
      try {
        const completedBlockIds = getCompletedBlockIds(interactions);
        const updatedVisibleBlocks = computeVisibleBlocks(state.lessonBlocks, interactions);
        const newActiveBlock = computeActiveBlock(updatedVisibleBlocks);

        return {
          lessonBlockInteractions: interactions,
          lessonProgress: calculateProgress(state.lessonBlocks, completedBlockIds),
          visibleBlocks: updatedVisibleBlocks,
          activeBlock: newActiveBlock,
          isLastBlock: checkIsLastBlock(newActiveBlock, state.lessonBlocks),
        };
      } catch (error) {
        console.error('Error setting lesson block interactions:', error);
        return {};
      }
    }),

  /**
   * Initializes the full lesson play flow: sets blocks, interactions, and computed state.
   */
  initializePlayFlow: (lesson, interactions) => {
    try {
      const sortedBlocks = [...lesson].sort((a, b) => a.position - b.position);
      const completedBlockIds = getCompletedBlockIds(interactions);
      const visibleBlocks = computeVisibleBlocks(sortedBlocks, interactions);

      const isLessonComplete = completedBlockIds.size === sortedBlocks.length;
      const newActiveBlock = isLessonComplete ? null : computeActiveBlock(visibleBlocks);

      set({
        lessonBlocks: sortedBlocks,
        lessonBlockInteractions: interactions,
        visibleBlocks,
        lessonProgress: calculateProgress(sortedBlocks, completedBlockIds),
        activeBlock: newActiveBlock,
        isLastBlock: checkIsLastBlock(newActiveBlock, sortedBlocks),
      });
    } catch (error) {
      console.error('Error initializing play flow:', error);
    }
  },

  /**
   * Resets all lesson-related state to initial defaults.
   */
  resetPlayFlow: () =>
    set({
      lessonBlocks: [],
      lessonBlockInteractions: [],
      visibleBlocks: [],
      lessonProgress: 0,
      activeBlock: null,
      isLastBlock: false,
    }),

  /**
   * Returns a specific interaction by block ID.
   */
  getBlockInteraction: (blockId) =>
    get().lessonBlockInteractions.find((interaction) => interaction.block_id === blockId),
}));

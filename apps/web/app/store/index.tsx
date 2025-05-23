import { create } from 'zustand';

import type { UserActiveSessionLoaderReturnType } from '~/root';
import type {
  GoLessonPlayInteractionReturnType,
  GoLessonPlayLessonBlocksType,
} from '~/routes/go/go-lesson-play';

// Store state and actions
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

  // Explanation state
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

// --- Helper functions ---

// Calculates progress as a percentage of total weight completed
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

// Filters completed block IDs
const getCompletedBlockIds = (interactions: GoLessonPlayInteractionReturnType): Set<string> =>
  new Set(interactions.filter((i) => i.is_complete).map((i) => i.block_id));

// Determines which blocks should be visible
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

// Gets the last visible block as the active block
const computeActiveBlock = (visibleBlocks: GoLessonPlayLessonBlocksType): string | null => {
  return visibleBlocks.length > 0 ? (visibleBlocks[visibleBlocks.length - 1]?.id ?? null) : null;
};

// Determines if current active block is the last one in the lesson
const checkIsLastBlock = (
  activeBlockId: string | null,
  lessonBlocks: GoLessonPlayLessonBlocksType,
): boolean => {
  if (!activeBlockId || lessonBlocks.length === 0) return false;

  const sortedBlocks = [...lessonBlocks].sort((a, b) => a.position - b.position);
  const lastBlock = sortedBlocks[sortedBlocks.length - 1];

  return activeBlockId === lastBlock?.id;
};

// Returns true if all blocks are completed
const shouldClearActiveBlock = (
  blocks: GoLessonPlayLessonBlocksType,
  completedBlockIds: Set<string>,
): boolean => {
  return blocks.length > 0 && completedBlockIds.size === blocks.length;
};

// --- Zustand store ---

export const useStore = create<StoreState>((set, get) => ({
  activeSession: null,
  updateActiveSession: (session) => set({ activeSession: session }),

  lessonBlocks: [],
  lessonBlockInteractions: [],
  visibleBlocks: [],
  lessonProgress: 0,
  activeBlock: null,
  isLastBlock: false,

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

  // Sets lesson blocks and updates derived state
  setCurrentLessonBlocks: (lessonBlocks) =>
    set((state) => {
      try {
        const completedBlockIds = getCompletedBlockIds(state.lessonBlockInteractions);
        const updatedVisibleBlocks = computeVisibleBlocks(
          lessonBlocks,
          state.lessonBlockInteractions,
        );
        const clearActive = shouldClearActiveBlock(lessonBlocks, completedBlockIds);

        return {
          lessonBlocks,
          lessonProgress: calculateProgress(lessonBlocks, completedBlockIds),
          visibleBlocks: updatedVisibleBlocks,
          activeBlock: clearActive ? null : computeActiveBlock(updatedVisibleBlocks),
          isLastBlock: false,
        };
      } catch (error) {
        console.error('Error setting lesson blocks:', error);
        return {};
      }
    }),

  // Sets interactions and updates derived state
  setLessonBlockInteractions: (interactions) =>
    set((state) => {
      try {
        const completedBlockIds = getCompletedBlockIds(interactions);
        const updatedVisibleBlocks = computeVisibleBlocks(state.lessonBlocks, interactions);
        const clearActive = shouldClearActiveBlock(state.lessonBlocks, completedBlockIds);

        return {
          lessonBlockInteractions: interactions,
          lessonProgress: calculateProgress(state.lessonBlocks, completedBlockIds),
          visibleBlocks: updatedVisibleBlocks,
          activeBlock: clearActive ? null : computeActiveBlock(updatedVisibleBlocks),
          isLastBlock: false,
        };
      } catch (error) {
        console.error('Error setting lesson block interactions:', error);
        return {};
      }
    }),

  // Initializes full play state
  initializePlayFlow: (lesson, interactions) => {
    try {
      const sortedBlocks = [...lesson].sort((a, b) => a.position - b.position);
      const completedBlockIds = getCompletedBlockIds(interactions);
      const visibleBlocks = computeVisibleBlocks(sortedBlocks, interactions);
      const clearActive = shouldClearActiveBlock(sortedBlocks, completedBlockIds);

      set({
        lessonBlocks: sortedBlocks,
        lessonBlockInteractions: interactions,
        visibleBlocks,
        lessonProgress: calculateProgress(sortedBlocks, completedBlockIds),
        activeBlock: clearActive ? null : computeActiveBlock(visibleBlocks),
        isLastBlock: false,
      });
    } catch (error) {
      console.error('Error initializing play flow:', error);
    }
  },

  // Clears the lesson state
  resetPlayFlow: () =>
    set({
      lessonBlocks: [],
      lessonBlockInteractions: [],
      visibleBlocks: [],
      lessonProgress: 0,
      activeBlock: null,
      isLastBlock: false,
    }),

  // Returns the interaction for a specific block
  getBlockInteraction: (blockId) =>
    get().lessonBlockInteractions.find((interaction) => interaction.block_id === blockId),
}));

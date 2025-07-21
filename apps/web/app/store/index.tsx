import { create } from 'zustand';

import type { FetchLessonBlocksProgressReturnType } from '@gonasi/database/publishedCourses';
import type { PublishedLessonBlocksArrayType } from '@gonasi/schemas/publish/base';

import type {
  UserActiveSessionLoaderReturnType,
  UserProfileLoaderReturnType,
  UserRoleLoaderReturnType,
} from '~/root';

// Helper type for individual progress interaction
type ProgressInteraction = FetchLessonBlocksProgressReturnType[number];

/**
 * Main application store interface containing all global state
 * Manages user authentication, lesson content, progress tracking, and user preferences
 */
interface StoreState {
  // User Authentication & Profile State
  activeSession: UserActiveSessionLoaderReturnType;
  activeUserProfile: UserProfileLoaderReturnType;
  activeUserRole: UserRoleLoaderReturnType;
  isActiveUserProfileLoading: boolean;

  // User Profile Management Actions
  updateActiveSession: (newSession: UserActiveSessionLoaderReturnType) => void;
  updateActiveUserProfile: (userProfile: UserProfileLoaderReturnType) => void;
  updateActiveUserRole: (userRole: UserRoleLoaderReturnType) => void;

  // Lesson Content & Progress State
  lessonBlocks: PublishedLessonBlocksArrayType;
  lessonBlockProgress: FetchLessonBlocksProgressReturnType;
  visibleBlocks: PublishedLessonBlocksArrayType;
  lessonProgress: number;

  // Active Lesson Navigation State
  activeBlock: string | null;
  isLastBlock: boolean;

  // Explanation Modal State
  isExplanationBottomSheetOpen: boolean;
  storeExplanationState: string | null;
  setExplanationState: (explanationState: string | null) => void;
  closeExplanation: () => void;

  // Lesson Flow Management Actions
  setCurrentLessonBlocks: (newLessonBlocks: PublishedLessonBlocksArrayType) => void;
  setLessonBlockInteractions: (progressInteractions: FetchLessonBlocksProgressReturnType) => void;
  initializePlayFlow: (flowData: {
    lessonBlocks: PublishedLessonBlocksArrayType;
    lessonBlockProgress: FetchLessonBlocksProgressReturnType;
  }) => void;
  resetPlayFlow: () => void;

  // Progress Query Helper
  getBlockInteraction: (blockId: string) => ProgressInteraction | undefined;

  // User Preference State & Actions
  isSoundEnabled: boolean;
  toggleSound: () => void;
  setSound: (soundEnabled: boolean) => void;

  isVibrationEnabled: boolean;
  toggleVibration: () => void;
  setVibration: (vibrationEnabled: boolean) => void;
}

// ==================== Helper Functions ====================

/**
 * Calculates the overall lesson progress as a percentage based on completed block weights
 * @param allLessonBlocks - Array of all lesson blocks in the lesson
 * @param completedBlockIds - Set of IDs for blocks that have been completed
 * @returns Progress percentage (0-100)
 */
const calculateLessonProgress = (
  allLessonBlocks: PublishedLessonBlocksArrayType,
  completedBlockIds: Set<string>,
): number => {
  const totalWeightSum = allLessonBlocks.reduce(
    (weightSum, currentBlock) => weightSum + (currentBlock.settings.weight || 0),
    0,
  );

  if (totalWeightSum === 0) return 0;

  const completedWeightSum = allLessonBlocks
    .filter((block) => completedBlockIds.has(block.id))
    .reduce((weightSum, completedBlock) => weightSum + (completedBlock.settings.weight || 0), 0);

  return (completedWeightSum / totalWeightSum) * 100;
};

/**
 * Extracts a set of completed block IDs from lesson progress interactions
 * @param progressInteractions - Array of progress interaction records
 * @returns Set containing IDs of all completed blocks
 */
const extractCompletedBlockIds = (
  progressInteractions: FetchLessonBlocksProgressReturnType,
): Set<string> => {
  return new Set(
    progressInteractions
      .filter((interaction) => interaction.is_completed)
      .map((completedInteraction) => completedInteraction.block_id),
  );
};

/**
 * Determines which lesson blocks should be visible to the user based on completion status
 * Only shows blocks that are unlocked (first block + blocks whose previous block is completed)
 * @param allLessonBlocks - Array of all lesson blocks
 * @param progressInteractions - Array of progress interaction records
 * @returns Array of blocks that should be visible/accessible to the user
 */
const determineVisibleBlocks = (
  allLessonBlocks: PublishedLessonBlocksArrayType,
  progressInteractions: FetchLessonBlocksProgressReturnType,
): PublishedLessonBlocksArrayType => {
  const blocksSortedByPosition = [...allLessonBlocks].sort(
    (blockA, blockB) => blockA.position - blockB.position,
  );

  return blocksSortedByPosition.filter((currentBlock, blockIndex) => {
    // First block is always visible
    if (blockIndex === 0) return true;

    // For subsequent blocks, check if the previous block is completed
    const previousBlock = blocksSortedByPosition[blockIndex - 1];
    if (!previousBlock) return false;

    return progressInteractions.some(
      (interaction) => interaction.block_id === previousBlock.id && interaction.is_completed,
    );
  });
};

/**
 * Identifies the currently active block (the last visible block in sequence)
 * @param visibleBlocks - Array of blocks visible to the user
 * @returns ID of the active block, or null if no blocks are visible
 */
const findActiveBlock = (visibleBlocks: PublishedLessonBlocksArrayType): string | null => {
  if (!visibleBlocks || visibleBlocks.length === 0) return null;
  return visibleBlocks[visibleBlocks.length - 1]?.id ?? null;
};

/**
 * Checks if the given block is the final block in the lesson sequence
 * @param activeBlockId - ID of the block to check
 * @param allLessonBlocks - Array of all lesson blocks
 * @returns true if the active block is the last block in the lesson
 */
const determineIfLastBlock = (
  activeBlockId: string | null,
  allLessonBlocks: PublishedLessonBlocksArrayType,
): boolean => {
  if (!activeBlockId || !allLessonBlocks || allLessonBlocks.length === 0) return false;

  const blocksSortedByPosition = [...allLessonBlocks].sort(
    (blockA, blockB) => blockA.position - blockB.position,
  );
  const finalBlock = blocksSortedByPosition[blocksSortedByPosition.length - 1];

  return !!finalBlock && activeBlockId === finalBlock.id;
};

// ==================== Store Implementation ====================

export const useStore = create<StoreState>((set, get) => ({
  // Initial User State
  activeSession: null,
  activeUserProfile: null,
  activeUserRole: 'user',
  isActiveUserProfileLoading: true,

  // User Profile Management
  updateActiveSession: (newSession) => set({ activeSession: newSession }),
  updateActiveUserProfile: (userProfile) =>
    set({ activeUserProfile: userProfile, isActiveUserProfileLoading: false }),
  updateActiveUserRole: (userRole) => set({ activeUserRole: userRole }),

  // Initial Lesson State
  lessonBlocks: [],
  lessonBlockProgress: [],
  visibleBlocks: [],
  lessonProgress: 0,
  activeBlock: null,
  isLastBlock: false,

  // Initial Explanation Modal State
  isExplanationBottomSheetOpen: false,
  storeExplanationState: null,

  /**
   * Sets the explanation state and controls modal visibility
   * Modal opens when state is not null, closes when state is null
   */
  setExplanationState: (explanationState) =>
    set({
      storeExplanationState: explanationState,
      isExplanationBottomSheetOpen: explanationState !== null,
    }),

  /**
   * Closes the explanation modal and clears explanation state
   */
  closeExplanation: () =>
    set({
      storeExplanationState: null,
      isExplanationBottomSheetOpen: false,
    }),

  /**
   * Updates lesson blocks and recalculates derived state (progress, visibility, active block)
   */
  setCurrentLessonBlocks: (newLessonBlocks) =>
    set((currentState) => {
      const existingInteractions = currentState.lessonBlockProgress;
      const completedBlockIds = extractCompletedBlockIds(existingInteractions);
      const visibleBlocks = determineVisibleBlocks(newLessonBlocks, existingInteractions);
      const activeBlock = findActiveBlock(visibleBlocks);

      return {
        lessonBlocks: newLessonBlocks,
        lessonProgress: calculateLessonProgress(newLessonBlocks, completedBlockIds),
        visibleBlocks,
        activeBlock,
        isLastBlock: determineIfLastBlock(activeBlock, newLessonBlocks),
      };
    }),

  /**
   * Updates progress interactions and recalculates derived state
   */
  setLessonBlockInteractions: (progressInteractions) =>
    set((currentState) => {
      const completedBlockIds = extractCompletedBlockIds(progressInteractions);
      const visibleBlocks = determineVisibleBlocks(currentState.lessonBlocks, progressInteractions);
      const activeBlock = findActiveBlock(visibleBlocks);

      return {
        lessonBlockProgress: progressInteractions,
        visibleBlocks,
        activeBlock,
        isLastBlock: determineIfLastBlock(activeBlock, currentState.lessonBlocks),
        lessonProgress: calculateLessonProgress(currentState.lessonBlocks, completedBlockIds),
      };
    }),

  /**
   * Initializes the lesson play flow with blocks and progress data
   * Sets up the complete lesson state including sorting and completion status
   */
  initializePlayFlow: ({ lessonBlocks, lessonBlockProgress }) => {
    const blocksSortedByPosition = [...lessonBlocks].sort(
      (blockA, blockB) => blockA.position - blockB.position,
    );
    const completedBlockIds = extractCompletedBlockIds(lessonBlockProgress);
    const visibleBlocks = determineVisibleBlocks(blocksSortedByPosition, lessonBlockProgress);
    const isLessonComplete = completedBlockIds.size === blocksSortedByPosition.length;
    const activeBlock = isLessonComplete ? null : findActiveBlock(visibleBlocks);

    set({
      lessonBlocks: blocksSortedByPosition,
      lessonBlockProgress,
      visibleBlocks,
      activeBlock,
      isLastBlock: determineIfLastBlock(activeBlock, blocksSortedByPosition),
      lessonProgress: calculateLessonProgress(blocksSortedByPosition, completedBlockIds),
    });
  },

  /**
   * Resets all lesson-related state to initial values
   */
  resetPlayFlow: () =>
    set({
      lessonBlocks: [],
      lessonBlockProgress: [],
      visibleBlocks: [],
      lessonProgress: 0,
      activeBlock: null,
      isLastBlock: false,
    }),

  /**
   * Retrieves the progress interaction record for a specific block
   */
  getBlockInteraction: (blockId) =>
    get().lessonBlockProgress.find((interaction) => interaction.block_id === blockId),

  // User Preference Initial State
  isSoundEnabled: true,
  isVibrationEnabled: true,

  // Sound Preference Actions
  toggleSound: () => set((currentState) => ({ isSoundEnabled: !currentState.isSoundEnabled })),
  setSound: (soundEnabled) => set({ isSoundEnabled: soundEnabled }),

  // Vibration Preference Actions
  toggleVibration: () =>
    set((currentState) => ({ isVibrationEnabled: !currentState.isVibrationEnabled })),
  setVibration: (vibrationEnabled) => set({ isVibrationEnabled: vibrationEnabled }),
}));

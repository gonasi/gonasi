import { useState, useCallback, useMemo } from 'react';

import type {
  ImageFocusQuizInteractionSchemaTypes,
  ImageFocusQuizStateSchemaTypes,
} from '@gonasi/schemas/plugins';
import type { FocusRegionSchemaTypes } from '@gonasi/schemas/plugins';

interface UseImageFocusQuizInteractionReturn {
  state: ImageFocusQuizStateSchemaTypes;
  currentRegion: FocusRegionSchemaTypes | null;
  currentRegionActualIndex: number;
  isAnswerRevealed: boolean;
  isLastRegion: boolean;
  isFirstRegion: boolean;
  isQuizComplete: boolean;
  totalRegions: number;
  completedCount: number;
  revealAnswer: () => void;
  nextRegion: () => void;
  previousRegion: () => void;
  reset: () => void;
}

export function useImageFocusQuizInteraction(
  initialData: ImageFocusQuizInteractionSchemaTypes | null,
  regions: FocusRegionSchemaTypes[],
  randomization: 'none' | 'shuffle',
): UseImageFocusQuizInteractionReturn {
  // Initialize region order (shuffle if needed)
  const regionOrder = useMemo(() => {
    if (initialData?.state.regionOrder && initialData.state.regionOrder.length === regions.length) {
      return initialData.state.regionOrder;
    }

    const order = regions.map((_, index) => index);
    if (randomization === 'shuffle') {
      // Fisher-Yates shuffle
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = order[i]!;
        order[i] = order[j]!;
        order[j] = temp;
      }
    }
    return order;
  }, [initialData?.state.regionOrder, regions.length, randomization]);

  // Initialize state
  const [state, setState] = useState<ImageFocusQuizStateSchemaTypes>(() => {
    if (initialData?.state) {
      return initialData.state;
    }

    return {
      currentRegionIndex: 0,
      completedRegions: [],
      regionOrder,
      startedAt: new Date().toISOString(),
      currentAnswerRevealed: false,
      currentRegionStartedAt: new Date().toISOString(),
    };
  });

  // Get current region based on order
  const currentRegionActualIndex = regionOrder[state.currentRegionIndex] ?? 0;
  const currentRegion = regions[currentRegionActualIndex] ?? null;

  // Computed values
  const isAnswerRevealed = state.currentAnswerRevealed;
  const isLastRegion = state.currentRegionIndex >= regionOrder.length - 1;
  const isFirstRegion = state.currentRegionIndex === 0;
  const isQuizComplete = state.completedRegions.length >= regions.length;
  const totalRegions = regions.length;
  const completedCount = state.completedRegions.length;

  // Reveal answer for current region
  const revealAnswer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentAnswerRevealed: true,
    }));
  }, []);

  // Move to next region
  const nextRegion = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentRegionIndex + 1;
      const currentRegionId = currentRegion?.id;

      // Add current region to completed if not already there
      const updatedCompleted = currentRegionId && !prev.completedRegions.includes(currentRegionId)
        ? [...prev.completedRegions, currentRegionId]
        : prev.completedRegions;

      return {
        ...prev,
        currentRegionIndex: nextIndex,
        completedRegions: updatedCompleted,
        currentAnswerRevealed: false,
        currentRegionStartedAt: new Date().toISOString(),
      };
    });
  }, [currentRegion?.id]);

  // Move to previous region
  const previousRegion = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentRegionIndex: Math.max(0, prev.currentRegionIndex - 1),
      currentAnswerRevealed: false,
      currentRegionStartedAt: new Date().toISOString(),
    }));
  }, []);

  // Reset quiz
  const reset = useCallback(() => {
    setState({
      currentRegionIndex: 0,
      completedRegions: [],
      regionOrder,
      startedAt: new Date().toISOString(),
      currentAnswerRevealed: false,
      currentRegionStartedAt: new Date().toISOString(),
    });
  }, [regionOrder]);

  return {
    state,
    currentRegion,
    currentRegionActualIndex,
    isAnswerRevealed,
    isLastRegion,
    isFirstRegion,
    isQuizComplete,
    totalRegions,
    completedCount,
    revealAnswer,
    nextRegion,
    previousRegion,
    reset,
  };
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFetcher } from 'react-router';

import type { FetchLessonBlocksProgressReturnType } from '@gonasi/database/publishedCourses';

import { useStore } from '~/store';

export interface ViewPluginCoreResult {
  loading: boolean;
  payload: FetchLessonBlocksProgressReturnType[number] | null;
  handleContinue: () => void;
  updatePayload: (updates: FetchLessonBlocksProgressReturnType[number]) => void;
}

/**
 * Custom hook for managing plugin view interaction.
 *
 * Responsibilities:
 * - Extracts the current block interaction
 * - Manages local overrides to the payload
 * - Tracks loading state via `useFetcher`
 * - Enriches the payload with timing info on submission
 */
export function useViewPluginCore(blockId: string | null): ViewPluginCoreResult {
  const fetcher = useFetcher();
  const { getBlockInteraction, isLastBlock } = useStore();

  const blockInteraction = getBlockInteraction(blockId ?? '');

  const [loading, setLoading] = useState(false);
  const [payloadOverrides, setPayloadOverrides] = useState<
    Partial<FetchLessonBlocksProgressReturnType[number]>
  >({});

  // Capture the time the user starts viewing the block
  const [startedAt] = useState(() => new Date().toISOString());

  // Update loading state based on fetcher's submission state
  useEffect(() => {
    setLoading(fetcher.state === 'submitting' || fetcher.state === 'loading');
  }, [fetcher.state]);

  /**
   * Final payload used in the view.
   * Combines the base interaction data with any local overrides.
   */
  const finalPayload = useMemo(() => {
    return {
      ...blockInteraction,
      ...payloadOverrides,
    } as FetchLessonBlocksProgressReturnType[number];
  }, [blockInteraction, payloadOverrides]);

  /**
   * Allows components to update specific fields in the payload
   */
  const updatePayload = useCallback((updates: FetchLessonBlocksProgressReturnType[number]) => {
    setPayloadOverrides((prev: Partial<FetchLessonBlocksProgressReturnType[number]>) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  /**
   * Submits the current interaction, enriched with:
   * - start and end timestamps
   * - time spent
   * - plugin type
   * - whether it is the last block
   */
  const handleContinue = useCallback(() => {
    if (!finalPayload) return;

    const completedAt = new Date().toISOString();
    const timeSpentSeconds = Math.round(
      (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000,
    );

    const enrichedPayload: FetchLessonBlocksProgressReturnType[number] = {
      ...finalPayload,
      is_completed: true,
      started_at: startedAt,
      completed_at: completedAt,
      time_spent_seconds: timeSpentSeconds,
    };

    const formData = new FormData();
    formData.append('intent', enrichedPayload.plugin_type ?? '');
    formData.append('isLast', isLastBlock ? 'true' : 'false');
    formData.append('payload', JSON.stringify(enrichedPayload));

    fetcher.submit(formData, { method: 'post' });
  }, [finalPayload, startedAt, isLastBlock, fetcher]);

  return {
    loading,
    payload: finalPayload,
    handleContinue,
    updatePayload,
  };
}

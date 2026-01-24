import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFetcher } from 'react-router';

import type { BlockInteractionSchemaTypes } from '@gonasi/schemas/plugins';
import type {
  BlockProgressSchemaTypes,
  BlockWithProgressSchemaTypes,
  SubmitBlockProgressSchemaTypes,
} from '@gonasi/schemas/publish/progressiveReveal';

export interface ViewPluginCoreArgs {
  progress: BlockProgressSchemaTypes;
  blockWithProgress: BlockWithProgressSchemaTypes;
}

export interface ViewPluginCoreResult {
  loading: boolean;
  payload: BlockProgressSchemaTypes | null;
  handleContinue: () => void;
  updateInteractionData: (interactionData: BlockInteractionSchemaTypes) => void;
  updateEarnedScore: (score: number) => void;
  updateAttemptsCount: (count: number) => void;
}

/**
 * Hook to manage user interaction for a plugin block.
 * Tracks interaction data, attempt count, earned score, and handles submission.
 */
export function useViewPluginCore(args: ViewPluginCoreArgs | null): ViewPluginCoreResult {
  const fetcher = useFetcher();

  const startTimeRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [interactionDataOverrides, setInteractionDataOverrides] = useState<
    BlockInteractionSchemaTypes | object
  >({});
  const [earnedScore, setEarnedScore] = useState<number | null>(null);
  const [attemptCount, setAttemptCount] = useState<number | null>(null);

  // Initialize session start time
  if (args && !startTimeRef.current) {
    startTimeRef.current = new Date().toISOString();
  }

  // Sync loading state with fetcher
  useEffect(() => {
    setLoading(fetcher.state === 'submitting' || fetcher.state === 'loading');
  }, [fetcher.state]);

  // Compose current interaction payload
  const payload = useMemo(() => {
    if (!args) return null;

    const baseProgress = args.blockWithProgress.block_progress ?? {};
    return {
      ...baseProgress,
      interaction_data: interactionDataOverrides,
      ...(earnedScore != null && { earned_score: earnedScore }),
      ...(attemptCount != null && { attempt_count: attemptCount }),
    } as BlockProgressSchemaTypes;
  }, [args, interactionDataOverrides, earnedScore, attemptCount]);

  // Merge incoming interaction data
  const updateInteractionData = useCallback((interactionData: BlockInteractionSchemaTypes) => {
    setInteractionDataOverrides((prev) => ({ ...prev, ...interactionData }));
  }, []);

  const updateEarnedScore = useCallback((score: number) => {
    setEarnedScore(score);
  }, []);

  const updateAttemptsCount = useCallback((count: number) => {
    setAttemptCount(count);
  }, []);

  // Submit interaction
  const handleContinue = useCallback(() => {
    if (!args || !startTimeRef.current) {
      console.warn('Missing args or start time for block submission');
      return;
    }

    const { block, is_last_block } = args.blockWithProgress;

    const completedAt = new Date().toISOString();
    const timeSpentSeconds = Math.round(
      (Date.now() - new Date(startTimeRef.current).getTime()) / 1000,
    );

    const enrichedPayload: SubmitBlockProgressSchemaTypes = {
      organization_id: block.organization_id,
      block_id: block.id,
      started_at: startTimeRef.current,
      completed_at: completedAt,
      time_spent_seconds: timeSpentSeconds,
      ...(earnedScore != null && { earned_score: earnedScore }),
      ...(attemptCount != null && { attempt_count: attemptCount }),
      interaction_data: payload?.interaction_data ?? {},
    };

    const formData = new FormData();
    formData.append('payload', JSON.stringify(enrichedPayload));
    if (is_last_block) {
      formData.append('isLast', 'true');
    }

    fetcher.submit(formData, { method: 'post' });
  }, [args, earnedScore, attemptCount, payload?.interaction_data, fetcher]);

  // Memoize empty handlers for null args to prevent infinite re-renders
  const emptyHandlers = useMemo(
    () => ({
      loading: false,
      payload: null,
      handleContinue: () => {},
      updateInteractionData: () => {},
      updateEarnedScore: () => {},
      updateAttemptsCount: () => {},
    }),
    [],
  );

  if (!args) {
    return emptyHandlers;
  }

  return {
    loading,
    payload,
    handleContinue,
    updateInteractionData,
    updateEarnedScore,
    updateAttemptsCount,
  };
}

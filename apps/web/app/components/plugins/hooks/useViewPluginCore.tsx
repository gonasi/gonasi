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
}

/**
 * Hook for managing progressive reveal block interactions.
 * Tracks block interaction state and prepares payloads for submission.
 */
export function useViewPluginCore(args: ViewPluginCoreArgs | null): ViewPluginCoreResult {
  const fetcher = useFetcher();
  const startTimeRef = useRef<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [interactionDataOverrides, setInteractionDataOverrides] = useState<
    BlockInteractionSchemaTypes | object
  >({});

  // Capture interaction start time only once per mount
  if (args && !startTimeRef.current) {
    startTimeRef.current = new Date().toISOString();
  }

  // Track fetcher state for loading indication
  useEffect(() => {
    const isSubmitting = fetcher.state === 'submitting' || fetcher.state === 'loading';
    setLoading(isSubmitting);
  }, [fetcher.state]);

  // Build the progress payload including interaction overrides
  const payload = useMemo(() => {
    if (!args) return null;
    const baseProgress = args.blockWithProgress.block_progress ?? {};

    return {
      ...baseProgress,
      interaction_data: interactionDataOverrides,
    } as BlockProgressSchemaTypes;
  }, [args, interactionDataOverrides]);

  // Merge new interaction data with existing overrides
  const updateInteractionData = useCallback((interactionData: BlockInteractionSchemaTypes) => {
    setInteractionDataOverrides((prev) => ({ ...prev, ...interactionData }));
  }, []);

  // Submit enriched progress payload when user continues
  const handleContinue = useCallback(() => {
    if (!args || !startTimeRef.current) {
      console.warn('Missing args or start time');
      return;
    }

    const completedAt = new Date().toISOString();
    const timeSpentSeconds = Math.round(
      (Date.now() - new Date(startTimeRef.current).getTime()) / 1000,
    );

    const { block, is_last_block } = args.blockWithProgress;

    const enrichedPayload: SubmitBlockProgressSchemaTypes = {
      block_id: block.id,
      interaction_data: payload?.interaction_data ?? {},
      started_at: startTimeRef.current,
      completed_at: completedAt,
      time_spent_seconds: timeSpentSeconds,
    };

    const formData = new FormData();
    formData.append('payload', JSON.stringify(enrichedPayload));

    if (is_last_block) {
      formData.append('isLast', 'true');
    }

    fetcher.submit(formData, { method: 'post' });
  }, [args, payload, fetcher]);

  // Return safe defaults if args not provided
  if (!args) {
    return {
      loading: false,
      payload: null,
      handleContinue: () => {},
      updateInteractionData: () => {},
    };
  }

  return {
    loading,
    payload,
    handleContinue,
    updateInteractionData,
  };
}

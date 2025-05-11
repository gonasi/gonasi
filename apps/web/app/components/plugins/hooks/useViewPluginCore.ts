import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFetcher, useParams } from 'react-router';

import type { Interaction, Json, PluginTypeId } from '@gonasi/schemas/plugins';
import { isValidInteraction } from '@gonasi/schemas/plugins';

import { useStore } from '~/store';

export interface ViewPluginSettings {
  autoContinue?: boolean;
  delayBeforeShow?: number;
  delayBeforeAutoContinue?: number;
  [key: string]: any;
}

export interface ViewPluginCoreProps {
  blockId: string;
  pluginType: PluginTypeId;
  settings: ViewPluginSettings;
  mode: 'play' | 'preview' | string;
}

export interface ViewPluginCoreResult {
  loading: boolean;
  canRender: boolean;
  handleContinue: () => void;
  payload: Interaction;
  blockInteractionData: any;
  isLastBlock: boolean;
  isActiveBlock: boolean;
}

export function useViewPluginCore({
  blockId,
  pluginType,
  settings,
  mode,
}: ViewPluginCoreProps): ViewPluginCoreResult {
  const fetcher = useFetcher();
  const params = useParams();
  const { getBlockInteraction, isLastBlock, activeBlock } = useStore();

  const { autoContinue, delayBeforeShow = 0, delayBeforeAutoContinue = 0 } = settings;

  const blockInteractionData = getBlockInteraction(blockId);

  const [loading, setLoading] = useState(false);
  const [startedAt] = useState(() => new Date().toISOString());
  const [canRender, setCanRender] = useState(delayBeforeShow === 0);

  // Loading state tracking
  useEffect(() => {
    setLoading(fetcher.state === 'submitting');
  }, [fetcher.state]);

  // Delayed render effect
  useEffect(() => {
    const delayMs = delayBeforeShow * 1000;

    const timeoutId = setTimeout(() => {
      setCanRender(true);
    }, delayMs);

    return () => clearTimeout(timeoutId);
  }, [delayBeforeShow]);

  // Auto-continue effect with is_complete guard
  useEffect(() => {
    if (!canRender || mode !== 'play' || !autoContinue || blockInteractionData?.is_complete) return;

    const autoContinueDelayMs = delayBeforeAutoContinue * 1000;

    const timeoutId = setTimeout(() => {
      handleContinue();
    }, autoContinueDelayMs);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRender, autoContinue, mode, delayBeforeAutoContinue, blockInteractionData?.is_complete]);

  // Interaction payload preparation
  const payload = useMemo<Interaction>(() => {
    return {
      plugin_type: pluginType,
      attempts: blockInteractionData?.attempts ?? 1,
      block_id: blockId,
      feedback: (blockInteractionData?.feedback as Json) ?? ({} as Json),
      is_complete: blockInteractionData?.is_complete ?? true,
      last_response: (blockInteractionData?.last_response as Json) ?? ({} as Json),
      lesson_id: params.lessonId ?? '',
      score: blockInteractionData?.score ?? 0,
      started_at: startedAt,
      state: (blockInteractionData?.state as Json) ?? ({ continue: true } as Json),
      time_spent_seconds: 0,
      completed_at: blockInteractionData?.completed_at ?? new Date().toISOString(),
    };
  }, [blockId, pluginType, params.lessonId, startedAt, blockInteractionData]);

  // Handler for continuing to next block
  const handleContinue = useCallback(() => {
    const completedAt = new Date();
    const timeSpentSeconds = Math.floor(
      (completedAt.getTime() - new Date(startedAt).getTime()) / 1000,
    );

    const updatedPayload: Interaction = {
      ...payload,
      completed_at: completedAt.toISOString(),
      time_spent_seconds: timeSpentSeconds,
    };

    if (!isValidInteraction(updatedPayload)) {
      console.error('Invalid payload:', updatedPayload);
      return;
    }

    const formData = new FormData();
    formData.append('intent', 'addBlockInteraction');
    formData.append('isLast', isLastBlock ? 'true' : 'false');
    formData.append('payload', JSON.stringify(updatedPayload));

    fetcher.submit(formData, { method: 'post' });
  }, [isLastBlock, fetcher, payload, startedAt]);

  return {
    loading,
    canRender,
    handleContinue,
    payload,
    blockInteractionData,
    isLastBlock,
    isActiveBlock: activeBlock === blockId,
  };
}

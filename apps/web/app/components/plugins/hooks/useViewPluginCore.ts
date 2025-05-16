import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFetcher, useParams } from 'react-router';

import type { Interaction, Json, PluginTypeId } from '@gonasi/schemas/plugins';
import { isValidInteraction } from '@gonasi/schemas/plugins';

import type { GoLessonPlayInteractionReturnType } from '~/routes/go/go-lesson-play';
import { useStore } from '~/store';

export interface ViewPluginSettings {
  delayBeforeShow?: number;
  [key: string]: any;
}

export interface ViewPluginCoreProps {
  blockId: string;
  pluginType: PluginTypeId;
  settings: ViewPluginSettings;
}

export interface ViewPluginCoreResult {
  loading: boolean;
  canRender: boolean;
  handleContinue: () => void;
  updatePayload: (updates: Partial<Interaction>) => void;
  payload: Interaction;
  blockInteractionData: GoLessonPlayInteractionReturnType[number] | undefined;
  isLastBlock: boolean;
  isActiveBlock: boolean;
}

export function useViewPluginCore({
  blockId,
  pluginType,
  settings,
}: ViewPluginCoreProps): ViewPluginCoreResult {
  const fetcher = useFetcher();
  const params = useParams();
  const { getBlockInteraction, isLastBlock, activeBlock } = useStore();

  const { delayBeforeShow = 0 } = settings;

  const blockInteractionData = getBlockInteraction(blockId);

  const [loading, setLoading] = useState(false);
  const [startedAt] = useState(() => new Date().toISOString());
  const [canRender, setCanRender] = useState(delayBeforeShow === 0);
  const [payloadUpdates, setPayloadUpdates] = useState<Partial<Interaction>>({});

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

  // Interaction payload preparation
  const payload = useMemo<Interaction>(() => {
    return {
      plugin_type: pluginType,
      attempts: 1,
      block_id: blockId,
      feedback: {} as Json,
      last_response: {} as Json,
      lesson_id: params.lessonId ?? '',
      score: 0,
      started_at: startedAt,
      state: { continue: true } as Json,
      time_spent_seconds: 0,
      completed_at: new Date().toISOString(),
      is_complete: true,
      ...payloadUpdates, // Apply any user updates
    };
  }, [blockId, pluginType, params.lessonId, startedAt, payloadUpdates]);

  // Function to update payload fields
  const updatePayload = useCallback((updates: Partial<Interaction>) => {
    setPayloadUpdates((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Handler for continuing to next block
  const handleContinue = useCallback(() => {
    const completedAt = new Date();
    const timeSpentSeconds = Math.floor(
      (completedAt.getTime() - new Date(payload.started_at).getTime()) / 1000,
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
  }, [isLastBlock, fetcher, payload]);

  return {
    loading,
    canRender,
    handleContinue,
    updatePayload,
    payload,
    blockInteractionData,
    isLastBlock,
    isActiveBlock: activeBlock === blockId,
  };
}

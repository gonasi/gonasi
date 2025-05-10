import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFetcher, useParams } from 'react-router';
import { motion } from 'framer-motion';

import { type Interaction, isValidInteraction, type Json } from '@gonasi/schemas/plugins';

import type { ViewPluginComponentProps } from '../../viewPluginTypesRenderer';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { BlockActionButton } from '~/components/ui/button';
import { ReducingProgress } from '~/components/ui/circular-progress';
import { useStore } from '~/store';

export function ViewRichTextPlugin({ block, mode }: ViewPluginComponentProps) {
  const fetcher = useFetcher();
  const params = useParams();

  const {
    settings: { autoContinue, delayBeforeShow, delayBeforeAutoContinue },
  } = block;

  const { getBlockInteraction, isLastBlock } = useStore();
  const blockInteractionData = getBlockInteraction(block.id);

  const [loading, setLoading] = useState(false);
  const [startedAt] = useState(() => new Date().toISOString());
  const [canRender, setCanRender] = useState(delayBeforeShow === 0);

  useEffect(() => {
    setLoading(fetcher.state === 'submitting');
  }, [fetcher.state]);

  useEffect(() => {
    const delayMs = (delayBeforeShow ?? 0) * 1000;

    const timeoutId = setTimeout(() => {
      setCanRender(true);
    }, delayMs);

    return () => clearTimeout(timeoutId);
  }, [delayBeforeShow]);

  // Auto-continue effect with is_complete guard
  useEffect(() => {
    if (!canRender || mode !== 'play' || !autoContinue || blockInteractionData?.is_complete) return;

    const autoContinueDelayMs = (delayBeforeAutoContinue ?? 0) * 1000;

    const timeoutId = setTimeout(() => {
      handleContinue();
    }, autoContinueDelayMs);

    return () => clearTimeout(timeoutId);
  }, [canRender, autoContinue, mode, delayBeforeAutoContinue, blockInteractionData?.is_complete]);

  const payload = useMemo<Interaction>(() => {
    const defaultPayload: Interaction = {
      plugin_type: block.plugin_type,
      attempts: blockInteractionData?.attempts ?? 1,
      block_id: block.id,
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
    return defaultPayload;
  }, [block, params.lessonId, startedAt, blockInteractionData]);

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

  if (!canRender) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <RichTextRenderer editorState={block.content.richTextState} />

      {blockInteractionData?.is_complete || mode === 'preview' || autoContinue ? null : (
        <BlockActionButton onClick={handleContinue} loading={loading} isLastBlock={isLastBlock} />
      )}
      {!blockInteractionData?.is_complete && autoContinue ? (
        <ReducingProgress time={delayBeforeAutoContinue} />
      ) : null}
    </motion.div>
  );
}

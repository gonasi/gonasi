import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFetcher, useParams } from 'react-router';
import { motion } from 'framer-motion';

import { type Interaction, isValidInteraction } from '@gonasi/schemas/plugins';

import type { ViewPluginComponentProps } from '../../viewPluginTypesRenderer';

import { ContinueButton } from '~/components/ui/button';

export function ViewRichTextPlugin({ block, mode }: ViewPluginComponentProps) {
  const fetcher = useFetcher();
  const params = useParams();

  const [loading, setLoading] = useState(false);
  const [startedAt] = useState(() => new Date().toISOString());

  useEffect(() => {
    setLoading(fetcher.state === 'submitting');
  }, [fetcher.state]);

  const payload = useMemo<Interaction>(
    () => ({
      plugin_type: block.plugin_type,
      attempts: 1,
      block_id: block.id,
      feedback: {},
      is_complete: true,
      last_response: {},
      lesson_id: params.lessonId ?? '',
      score: 0,
      started_at: startedAt,
      state: { continue: true },
      time_spent_seconds: 0,
      completed_at: new Date().toISOString(),
    }),
    [block, params.lessonId, startedAt],
  );

  const handleContinue = useCallback(() => {
    if (!isValidInteraction(payload)) {
      console.error('Invalid payload:', payload);
      return;
    }

    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));

    // TODO: Optimistic update in Zustand store
    fetcher.submit(formData, { method: 'post' });
  }, [fetcher, payload]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className='py-4 whitespace-pre-wrap'>{block.content.data.richTextState}</div>
      <ContinueButton onClick={handleContinue} loading={loading} disabled={mode === 'preview'} />
    </motion.div>
  );
}

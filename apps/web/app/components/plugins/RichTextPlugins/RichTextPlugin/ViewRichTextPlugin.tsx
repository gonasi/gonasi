import { useState } from 'react';
import { motion } from 'framer-motion';

import type { ViewPluginComponentProps } from '../../viewPluginTypesRenderer';

import { ContinueButton } from '~/components/ui/button';

export function ViewRichTextPlugin({ block, mode }: ViewPluginComponentProps) {
  const [startedAt] = useState(() => Date.now());

  const handleContinue = () => {
    const timeSpent = Math.floor((Date.now() - startedAt) / 1000);

    const interaction = {
      is_complete: true,
      completed_at: new Date().toISOString(),
      time_spent_seconds: timeSpent,
      attempts: 1,
      state: { acknowledged: true },
      last_response: { clickedContinue: true },
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className='py-4'>
        <div>{block.content.data.richTextState}</div>
      </div>
      <ContinueButton onClick={handleContinue} loading={false} disabled={mode === 'preview'} />
    </motion.div>
  );
}

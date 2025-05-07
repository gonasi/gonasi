import { motion } from 'framer-motion';

import type { ViewPluginComponentProps } from '../../viewPluginTypesRenderer';

import { ContinueButton } from '~/components/ui/button';

export function ViewRichTextPlugin({ block, mode }: ViewPluginComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className='py-4'>
        <div>{block.content.data.richTextState}</div>
      </div>
      <ContinueButton onClick={() => {}} loading={false} disabled={mode === 'preview'} />
    </motion.div>
  );
}

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

import { BlockActionButton } from '~/components/ui/button';
import { ReducingProgress } from '~/components/ui/circular-progress';

export interface ViewPluginWrapperProps {
  children: ReactNode;
  mode: string;
  loading: boolean;
  isLastBlock: boolean;
  isComplete?: boolean;
  autoContinue?: boolean;
  delayBeforeAutoContinue?: number;
  onContinue: () => void;
}

export function ViewPluginWrapper({
  children,
  mode,
  loading,
  isLastBlock,
  isComplete = false,
  autoContinue = false,
  delayBeforeAutoContinue = 0,
  onContinue,
}: ViewPluginWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}

      {isComplete || mode === 'preview' || autoContinue ? null : (
        <BlockActionButton onClick={onContinue} loading={loading} isLastBlock={isLastBlock} />
      )}

      {!isComplete && autoContinue ? <ReducingProgress time={delayBeforeAutoContinue} /> : null}
    </motion.div>
  );
}

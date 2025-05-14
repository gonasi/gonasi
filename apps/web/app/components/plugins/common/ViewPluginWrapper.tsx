import { type ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

import { Badge } from '~/components/ui/badge';
import { BlockActionButton } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';

export interface ViewPluginWrapperProps {
  children: ReactNode;
  isComplete?: boolean;
  playbackMode?: 'inline' | 'standalone';
  mode: 'preview' | 'play';
}

export function ViewPluginWrapper({
  children,
  isComplete = false,
  playbackMode = 'inline',
  mode,
}: ViewPluginWrapperProps) {
  const [open, setOpen] = useState(true);
  const isStandalone = playbackMode === 'standalone';

  // Animation settings extracted for reuse
  const animatedContent = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );

  if (mode === 'preview') {
    return (
      <div>
        <Badge className='text-xs' variant='outline'>
          <Settings />
          Standalone
        </Badge>
        {animatedContent}
      </div>
    );
  }

  // If closed in standalone mode, just render the button to reopen
  if (!open && isStandalone) {
    return <BlockActionButton onClick={() => setOpen(true)} loading={false} isLastBlock={false} />;
  }

  // If standalone mode and not complete, render in modal
  if (isStandalone && !isComplete) {
    return (
      <Modal open={open} onOpenChange={(newOpen) => newOpen || setOpen(false)}>
        <Modal.Content size='md'>
          <Modal.Header title='' />
          <Modal.Body>{animatedContent}</Modal.Body>
        </Modal.Content>
      </Modal>
    );
  }

  // Default case: just render the content
  return animatedContent;
}

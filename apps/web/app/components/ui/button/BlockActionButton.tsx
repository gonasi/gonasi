import { motion } from 'framer-motion';
import { ArrowRight, PartyPopper } from 'lucide-react';

import { Button } from '~/components/ui/button';

interface BlockActionButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  isLastBlock: boolean;
}

export function BlockActionButton({
  onClick,
  loading,
  disabled,
  isLastBlock,
}: BlockActionButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.3, ease: 'easeOut' }}
      className='relative'
    >
      <motion.div
        animate={{
          x: [0, 4, 0],
        }}
        transition={{
          repeat: Infinity,
          repeatDelay: 2,
          duration: 0.6,
          ease: 'easeInOut',
        }}
      >
        <Button
          type='submit'
          onClick={onClick}
          className='rounded-full'
          variant={isLastBlock ? 'default' : 'secondary'}
          isLoading={loading}
          disabled={disabled}
          rightIcon={isLastBlock ? <PartyPopper /> : <ArrowRight />}
        >
          {isLastBlock ? 'Complete Lesson' : 'Continue'}
        </Button>
      </motion.div>
    </motion.div>
  );
}

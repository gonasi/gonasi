import { motion } from 'framer-motion';
import { Howl } from 'howler';
import { ArrowRight, PartyPopper } from 'lucide-react';

import tapSound from '/assets/sounds/block-action-button.mp3';
import { Button } from '~/components/ui/button';
import { useStore } from '~/store';

// Create Howl instance outside component to avoid recreation on every render
const tapHowl = new Howl({
  src: [tapSound],
  volume: 0.5,
  preload: true, // Preload for better performance
});

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
  const { isSoundEnabled } = useStore();

  const handleClickWithSound = () => {
    onClick(); // Fixed: removed erroneous arrow function wrapper

    // Only play sound if not disabled and not loading
    if (!disabled && !loading && isSoundEnabled) {
      tapHowl.play();
    }
  };

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
          onClick={handleClickWithSound}
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

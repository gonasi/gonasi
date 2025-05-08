import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { Button } from '~/components/ui/button';

interface ContinueButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  label?: string;
}

export function ContinueButton({
  onClick,
  loading,
  disabled,
  label = 'Continue',
}: ContinueButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.3, ease: 'easeOut' }} // Delay added here
      className='relative'
    >
      <motion.div
        animate={{
          y: [0, -2, 0],
        }}
        transition={{
          repeat: Infinity,
          repeatDelay: 2,
          duration: 0.6,
          ease: 'easeInOut',
        }}
      >
        <Button
          size='sm'
          onClick={onClick}
          className='rounded-full'
          variant='secondary'
          isLoading={loading}
          disabled={disabled}
          rightIcon={<ArrowRight />}
        >
          {label}
        </Button>
      </motion.div>
    </motion.div>
  );
}

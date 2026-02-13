import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface QuestionSoftLockedPanelProps {
  onComplete: () => void;
  gracePeriodSeconds?: number;
}

/**
 * Panel shown during soft lock phase (play_state = 'question_soft_locked')
 * - Brief grace period for final submissions
 * - Auto-advances to 'question_locked' after grace period
 */
export function QuestionSoftLockedPanel({
  onComplete,
  gracePeriodSeconds = 3,
}: QuestionSoftLockedPanelProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, gracePeriodSeconds * 1000);

    return () => clearTimeout(timer);
  }, [onComplete, gracePeriodSeconds]);

  return (
    <motion.div
      className='flex min-h-[60vh] flex-col items-center justify-center space-y-6 p-8'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Warning Icon */}
      <motion.div
        className='bg-warning/10 relative flex h-24 w-24 items-center justify-center rounded-full'
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <AlertCircle size={48} className='text-warning' />

        {/* Pulsing rings */}
        {[0, 0.3, 0.6].map((delay) => (
          <motion.div
            key={delay}
            className='border-warning absolute inset-0 rounded-full border-2'
            animate={{
              scale: [1, 1.8],
              opacity: [0.8, 0],
            }}
            transition={{
              duration: 1.5,
              delay,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}
      </motion.div>

      {/* Message */}
      <motion.div
        className='space-y-2 text-center'
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className='text-warning text-2xl font-bold'>Time's Almost Up!</h2>
        <p className='text-muted-foreground'>Final submissions being accepted...</p>
      </motion.div>

      {/* Countdown bar */}
      <div className='bg-muted relative h-2 w-64 overflow-hidden rounded-full'>
        <motion.div
          className='bg-warning absolute inset-y-0 left-0'
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{
            duration: gracePeriodSeconds,
            ease: 'linear',
          }}
        />
      </div>

      <motion.p
        className='text-muted-foreground text-sm'
        animate={{
          opacity: [1, 0.5, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
        }}
      >
        Locking in {gracePeriodSeconds} seconds...
      </motion.p>
    </motion.div>
  );
}

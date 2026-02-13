import { motion } from 'framer-motion';
import { Coffee, ArrowRight } from 'lucide-react';

import { Button } from '~/components/ui/button';

interface IntermissionPanelProps {
  onNext: () => void;
  nextQuestionNumber?: number;
  isLastQuestion?: boolean;
  disabled?: boolean;
}

/**
 * Panel shown during intermission (play_state = 'intermission')
 * - Brief break between questions
 * - Gives participants time to breathe
 * - Host can start next question when ready
 */
export function IntermissionPanel({
  onNext,
  nextQuestionNumber,
  isLastQuestion = false,
  disabled = false,
}: IntermissionPanelProps) {
  return (
    <motion.div
      className='flex min-h-[60vh] flex-col items-center justify-center space-y-8 p-8'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Coffee Icon */}
      <motion.div
        className='bg-primary/10 relative flex h-28 w-28 items-center justify-center rounded-full'
        initial={{ scale: 0, rotate: 45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 150,
          damping: 12,
        }}
      >
        <Coffee size={56} className='text-primary' />

        {/* Steam animation */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className='bg-primary/30 absolute -top-4 left-1/2 h-3 w-1 -translate-x-1/2 rounded-full'
            style={{ left: `${40 + i * 10}%` }}
            animate={{
              y: [-5, -25],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}
      </motion.div>

      {/* Title */}
      <motion.div
        className='space-y-3 text-center'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className='text-3xl font-bold'>Quick Break</h2>
        <p className='text-muted-foreground'>
          {isLastQuestion
            ? 'Preparing final results...'
            : `Get ready for Question ${nextQuestionNumber || 'Next'}`}
        </p>
      </motion.div>

      {/* Relaxing Message */}
      <motion.div
        className='bg-muted/50 max-w-md space-y-4 rounded-lg border p-6 text-center'
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.p
          className='text-sm font-medium'
          animate={{
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          Take a breath...
        </motion.p>

        <p className='text-muted-foreground text-xs'>
          This is a short break for participants to relax before the next question. Continue when
          everyone is ready!
        </p>
      </motion.div>

      {/* Animated Progress Dots */}
      <div className='flex items-center gap-2'>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className='bg-primary h-2 w-2 rounded-full'
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button size='lg' onClick={onNext} disabled={disabled} className='gap-2 px-8 py-6 text-lg'>
          {isLastQuestion ? (
            <>Show Final Results</>
          ) : (
            <>
              Start Next Question
              <ArrowRight size={24} />
            </>
          )}
        </Button>
      </motion.div>

      {/* Helper Text */}
      <motion.p
        className='text-muted-foreground text-xs'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {isLastQuestion
          ? 'All questions completed! Prepare to reveal the winners.'
          : 'This break helps maintain engagement and gives everyone a moment to reset.'}
      </motion.p>
    </motion.div>
  );
}

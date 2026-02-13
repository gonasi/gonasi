import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

import { Button } from '~/components/ui/button';

interface QuestionLockedPanelProps {
  onReveal: () => void;
  disabled?: boolean;
}

/**
 * Panel shown when question is locked (play_state = 'question_locked')
 * - All submissions are closed
 * - Build suspense before revealing answer
 * - Host clicks "Reveal Answer" to show results
 */
export function QuestionLockedPanel({ onReveal, disabled = false }: QuestionLockedPanelProps) {
  return (
    <motion.div
      className='flex min-h-[60vh] flex-col items-center justify-center space-y-8 p-8'
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Lock Icon with Animation */}
      <motion.div
        className='bg-danger/10 relative flex h-32 w-32 items-center justify-center rounded-full'
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
        }}
      >
        <Lock size={64} className='text-danger' />

        {/* Rotating border */}
        <motion.div
          className='border-danger absolute inset-0 rounded-full border-4 border-dashed'
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </motion.div>

      {/* Status Message */}
      <motion.div
        className='space-y-3 text-center'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className='text-3xl font-bold'>Question Locked! 🔒</h2>
        <p className='text-muted-foreground text-lg'>All answers have been submitted</p>
      </motion.div>

      {/* Suspense Message */}
      <motion.div
        className='bg-muted/50 max-w-md space-y-3 rounded-lg border p-6 text-center'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.p
          className='text-sm font-medium'
          animate={{
            opacity: [1, 0.6, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          The moment of truth...
        </motion.p>
        <p className='text-muted-foreground text-xs'>
          Build the suspense! Click below when you're ready to reveal the correct answer.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className='grid grid-cols-2 gap-4'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {[
          { label: 'Status', value: 'Locked', color: 'text-danger' },
          { label: 'Next', value: 'Reveal Answer', color: 'text-primary' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            className='bg-muted/50 flex flex-col items-center gap-2 rounded-lg border p-4'
            whileHover={{ scale: 1.05 }}
          >
            <p className='text-muted-foreground text-xs uppercase tracking-wider'>{stat.label}</p>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Reveal Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        <Button
          size='lg'
          onClick={onReveal}
          disabled={disabled}
          className='bg-success hover:bg-success/90 gap-2 px-8 py-6 text-lg'
        >
          <Lock size={24} />
          Reveal Answer
        </Button>
      </motion.div>

      {/* Helper Text */}
      <motion.p
        className='text-muted-foreground max-w-md text-center text-xs'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Participants are waiting! Take your time to build anticipation, then reveal the correct
        answer.
      </motion.p>
    </motion.div>
  );
}

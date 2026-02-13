import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';

import type { LiveSessionGameState } from '../hooks/useLiveSessionGameState';

import { Button } from '~/components/ui/button';

interface QuestionResultsPanelProps {
  state: LiveSessionGameState;
  onNext: () => void;
  disabled?: boolean;
}

/**
 * Panel shown when revealing question results (play_state = 'question_results')
 * - Shows correct answer and explanation
 * - Displays answer statistics (if available)
 * - Host clicks "Show Leaderboard" to continue
 */
export function QuestionResultsPanel({
  state,
  onNext,
  disabled = false,
}: QuestionResultsPanelProps) {
  const currentBlock = state.blocks[state.currentBlockIndex];
  const questionNumber = state.currentBlockIndex + 1;

  return (
    <motion.div
      className='flex min-h-[60vh] flex-col items-center justify-center space-y-8 p-8'
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Success Icon */}
      <motion.div
        className='bg-success/10 relative flex h-28 w-28 items-center justify-center rounded-full'
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 12,
        }}
      >
        <CheckCircle size={56} className='text-success fill-success/20' />

        {/* Expanding ring */}
        <motion.div
          className='border-success absolute inset-0 rounded-full border-4'
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{
            duration: 1,
            ease: 'easeOut',
          }}
        />
      </motion.div>

      {/* Title */}
      <motion.div
        className='space-y-2 text-center'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className='text-3xl font-bold'>The Answer Is...</h2>
        <p className='text-muted-foreground text-sm'>
          Question {questionNumber} of {state.blocks.length}
        </p>
      </motion.div>

      {/* Answer Card */}
      <motion.div
        className='border-success/30 bg-success/5 w-full max-w-2xl space-y-4 rounded-xl border-2 p-8'
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: 'spring' }}
      >
        {/* Correct Answer Badge */}
        <div className='bg-success/20 text-success inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium'>
          <CheckCircle size={16} />
          Correct Answer
        </div>

        {/* Block Info */}
        <div className='space-y-2'>
          <h3 className='text-xl font-bold'>{currentBlock?.name || `Question ${questionNumber}`}</h3>

          {/* Placeholder for actual answer - would come from block data */}
          <div className='bg-muted/50 mt-4 rounded-lg p-4'>
            <p className='text-muted-foreground text-sm'>
              Answer details would display here based on block type and correct answer data
            </p>
          </div>
        </div>

        {/* Explanation (if available) */}
        <div className='bg-muted/30 rounded-lg p-4'>
          <p className='text-muted-foreground text-xs font-medium uppercase tracking-wide'>
            Explanation
          </p>
          <p className='text-muted-foreground mt-2 text-sm'>
            Detailed explanation would appear here if provided in the block configuration
          </p>
        </div>
      </motion.div>

      {/* Answer Stats */}
      <motion.div
        className='grid w-full max-w-2xl grid-cols-3 gap-4'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {[
          { label: 'Correct', value: '-', color: 'text-success' },
          { label: 'Incorrect', value: '-', color: 'text-danger' },
          { label: 'No Answer', value: '-', color: 'text-muted-foreground' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            className='bg-muted/50 flex flex-col items-center gap-2 rounded-lg border p-4'
            whileHover={{ scale: 1.05 }}
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className='text-muted-foreground text-xs'>{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button size='lg' onClick={onNext} disabled={disabled} className='gap-2 px-8 py-6 text-lg'>
          Show Leaderboard
          <ArrowRight size={24} />
        </Button>
      </motion.div>

      {/* Helper Text */}
      <motion.p
        className='text-muted-foreground text-xs'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Review the answer with participants, then show the updated leaderboard
      </motion.p>
    </motion.div>
  );
}

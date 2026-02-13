import { motion } from 'framer-motion';
import { Clock, Lock, Pause, SkipForward } from 'lucide-react';

import type { LiveSessionGameState } from '../hooks/useLiveSessionGameState';

import { Button } from '~/components/ui/button';

interface QuestionActivePanelProps {
  state: LiveSessionGameState;
  onLockNow: () => void;
  onSkip: () => void;
  onPause: () => void;
  disabled?: boolean;
}

/**
 * Panel shown during active question (play_state = 'question_active')
 * - Displays current question and block info
 * - Shows timer countdown (if applicable)
 * - Host can lock early, skip, or pause
 */
export function QuestionActivePanel({
  state,
  onLockNow,
  onSkip,
  onPause,
  disabled = false,
}: QuestionActivePanelProps) {
  const currentBlock = state.blocks[state.currentBlockIndex];
  const questionNumber = state.currentBlockIndex + 1;
  const totalQuestions = state.blocks.length;

  return (
    <motion.div
      className='flex min-h-[60vh] flex-col items-center justify-center space-y-8 p-8'
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4 }}
    >
      {/* Progress Header */}
      <motion.div
        className='w-full max-w-2xl space-y-2'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground text-sm font-medium'>
            Question {questionNumber} of {totalQuestions}
          </span>
          <div className='flex items-center gap-2'>
            <Clock size={16} className='text-primary' />
            <span className='text-primary font-mono text-sm font-bold'>Active</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className='bg-muted h-2 overflow-hidden rounded-full'>
          <motion.div
            className='bg-primary h-full'
            initial={{ width: 0 }}
            animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Question Display */}
      <motion.div
        className='border-primary/20 bg-primary/5 w-full max-w-2xl space-y-4 rounded-xl border-2 p-8'
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className='flex items-start justify-between gap-4'>
          <div className='flex-1 space-y-2'>
            <p className='text-muted-foreground text-xs font-medium uppercase tracking-wide'>
              Current Block
            </p>
            <h2 className='text-2xl font-bold'>
              {currentBlock?.name || `Question ${questionNumber}`}
            </h2>
          </div>

          {/* Animated pulse indicator */}
          <motion.div
            className='bg-success relative flex h-12 w-12 items-center justify-center rounded-full'
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Clock size={24} className='text-white' />
            <motion.div
              className='border-success absolute inset-0 rounded-full border-2'
              animate={{
                scale: [1, 1.5],
                opacity: [1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          </motion.div>
        </div>

        {/* Block Type Info */}
        {currentBlock?.block_type && (
          <div className='bg-muted/50 rounded-lg p-3'>
            <p className='text-muted-foreground text-sm'>
              Type: <span className='font-medium'>{currentBlock.block_type}</span>
            </p>
          </div>
        )}
      </motion.div>

      {/* Participant Activity Indicator */}
      <motion.div
        className='bg-muted/50 flex items-center gap-3 rounded-lg border p-4'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className='bg-success h-2 w-2 rounded-full'
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
        <p className='text-muted-foreground text-sm'>
          Participants are answering... Monitor their progress on the display screen
        </p>
      </motion.div>

      {/* Host Controls */}
      <motion.div
        className='flex flex-wrap items-center justify-center gap-3'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          variant='default'
          size='lg'
          onClick={onLockNow}
          disabled={disabled}
          className='gap-2'
        >
          <Lock size={20} />
          Lock Question Now
        </Button>

        <Button variant='ghost' size='lg' onClick={onPause} disabled={disabled} className='gap-2'>
          <Pause size={20} />
          Pause Session
        </Button>

        <Button
          variant='ghost'
          size='lg'
          onClick={onSkip}
          disabled={disabled}
          className='text-warning gap-2'
        >
          <SkipForward size={20} />
          Skip Block
        </Button>
      </motion.div>

      {/* Helper Text */}
      <motion.p
        className='text-muted-foreground max-w-md text-center text-xs'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Participants can see and answer this question. Lock when ready to reveal the answer, or wait
        for the timer to expire.
      </motion.p>
    </motion.div>
  );
}

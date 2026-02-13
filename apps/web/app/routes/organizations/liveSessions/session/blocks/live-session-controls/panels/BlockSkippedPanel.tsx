import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FastForward } from 'lucide-react';

interface BlockSkippedPanelProps {
  blockName?: string;
  onComplete: () => void;
  displaySeconds?: number;
}

/**
 * Panel shown when block is skipped (play_state = 'block_skipped')
 * - Brief notification that block was skipped
 * - Auto-advances to next question after short display
 * - Typically shows for 2 seconds
 */
export function BlockSkippedPanel({
  blockName,
  onComplete,
  displaySeconds = 2,
}: BlockSkippedPanelProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, displaySeconds * 1000);

    return () => clearTimeout(timer);
  }, [onComplete, displaySeconds]);

  return (
    <motion.div
      className='flex min-h-[60vh] flex-col items-center justify-center space-y-6 p-8'
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
    >
      {/* Skip Icon */}
      <motion.div
        className='bg-secondary/10 relative flex h-24 w-24 items-center justify-center rounded-full'
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 250,
          damping: 15,
        }}
      >
        <FastForward size={48} className='text-secondary' />

        {/* Fast motion lines */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className='bg-secondary/30 absolute right-0 h-1 rounded-full'
            style={{ top: `${30 + i * 12}%` }}
            initial={{ width: '0%', x: 0 }}
            animate={{ width: '100%', x: 40 }}
            transition={{
              duration: 0.5,
              delay: i * 0.1,
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
        <h2 className='text-secondary text-2xl font-bold'>Block Skipped</h2>
        {blockName && <p className='text-muted-foreground text-sm'>{blockName}</p>}
      </motion.div>

      {/* Auto-advance indicator */}
      <motion.div
        className='flex items-center gap-2'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.p
          className='text-muted-foreground text-xs'
          animate={{
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
        >
          Moving to next question...
        </motion.p>

        {/* Animated dots */}
        <div className='flex gap-1'>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className='bg-secondary h-1.5 w-1.5 rounded-full'
              animate={{
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1,
                delay: i * 0.2,
                repeat: Infinity,
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

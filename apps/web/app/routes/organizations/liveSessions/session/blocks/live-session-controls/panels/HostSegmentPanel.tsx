import { motion } from 'framer-motion';
import { Mic, MessageSquare, ArrowRight } from 'lucide-react';

import { Button } from '~/components/ui/button';

interface HostSegmentPanelProps {
  onEnd: () => void;
  disabled?: boolean;
}

/**
 * Panel shown during host segment (play_state = 'host_segment')
 * - Host is talking to the crowd
 * - Participants see "Host is speaking" message
 * - Returns to previous play state when ended
 */
export function HostSegmentPanel({ onEnd, disabled = false }: HostSegmentPanelProps) {
  return (
    <motion.div
      className='flex min-h-[60vh] flex-col items-center justify-center space-y-8 p-8'
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Microphone Icon */}
      <motion.div
        className='bg-primary/10 relative flex h-32 w-32 items-center justify-center rounded-full'
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 12,
        }}
      >
        <Mic size={64} className='text-primary' />

        {/* Animated sound waves */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className='border-primary absolute inset-0 rounded-full border-2'
            animate={{
              scale: [1, 1.4 + i * 0.2],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 2,
              delay: i * 0.4,
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
        <h2 className='text-3xl font-bold'>Host Segment</h2>
        <p className='text-muted-foreground text-lg'>You're live with the participants</p>
      </motion.div>

      {/* Status Card */}
      <motion.div
        className='bg-primary/5 border-primary/30 max-w-md space-y-4 rounded-lg border-2 p-6'
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        {/* Live Indicator */}
        <div className='flex items-center justify-center gap-2'>
          <motion.div
            className='bg-primary h-3 w-3 rounded-full'
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <span className='text-primary text-sm font-bold uppercase tracking-wide'>
            You're Speaking
          </span>
        </div>

        {/* Instructions */}
        <div className='space-y-3'>
          <div className='flex items-start gap-3'>
            <MessageSquare size={20} className='text-primary mt-0.5' />
            <div className='flex-1'>
              <p className='text-sm font-medium'>Participants can see:</p>
              <p className='text-muted-foreground text-xs'>
                "Host is speaking - Please listen"
              </p>
            </div>
          </div>

          <div className='bg-muted/50 rounded-lg p-3'>
            <p className='text-muted-foreground text-xs'>
              Use this time to share insights, tell stories, or engage with the audience. Click
              "End Host Segment" when you're ready to continue.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Sound Wave Animation */}
      <div className='flex items-end gap-1'>
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className='bg-primary w-2 rounded-full'
            animate={{
              height: ['16px', '48px', '16px'],
            }}
            transition={{
              duration: 1,
              delay: i * 0.1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* End Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          size='lg'
          onClick={onEnd}
          disabled={disabled}
          className='gap-2 px-8 py-6 text-lg'
          variant='ghost'
        >
          End Host Segment
          <ArrowRight size={24} />
        </Button>
      </motion.div>

      {/* Helper Text */}
      <motion.p
        className='text-muted-foreground max-w-md text-center text-xs'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Take your time! This segment will continue until you end it. The game will resume from where
        you paused.
      </motion.p>
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { Pause, Play, AlertTriangle } from 'lucide-react';

import type { Database } from '@gonasi/database/schema';

import { Button } from '~/components/ui/button';

interface PausedPanelProps {
  reason: Database['public']['Enums']['live_session_pause_reason'] | null;
  onResume: () => void;
  disabled?: boolean;
}

const PAUSE_REASON_LABELS: Record<
  Database['public']['Enums']['live_session_pause_reason'],
  { title: string; description: string; icon: typeof AlertTriangle }
> = {
  technical_issue: {
    title: 'Technical Issue',
    description: 'Session paused due to technical difficulties',
    icon: AlertTriangle,
  },
  host_hold: {
    title: 'Host Hold',
    description: 'Host has paused the session',
    icon: Pause,
  },
  moderation: {
    title: 'Moderation',
    description: 'Session paused for moderation purposes',
    icon: AlertTriangle,
  },
  system: {
    title: 'System Pause',
    description: 'Session paused by the system',
    icon: AlertTriangle,
  },
};

/**
 * Panel shown when session is paused (play_state = 'paused')
 * - Displays pause reason
 * - Host can resume when ready
 * - Returns to previous play state on resume
 */
export function PausedPanel({ reason, onResume, disabled = false }: PausedPanelProps) {
  const pauseInfo = reason ? PAUSE_REASON_LABELS[reason] : null;
  const PauseIcon = pauseInfo?.icon || Pause;

  return (
    <motion.div
      className='flex min-h-[60vh] flex-col items-center justify-center space-y-8 p-8'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Pause Icon */}
      <motion.div
        className='bg-warning/10 relative flex h-32 w-32 items-center justify-center rounded-full'
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
        }}
      >
        <PauseIcon size={64} className='text-warning' />

        {/* Pulsing ring */}
        <motion.div
          className='border-warning absolute inset-0 rounded-full border-4'
          animate={{
            scale: [1, 1.2],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
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
        <h2 className='text-3xl font-bold'>Session Paused</h2>
        <p className='text-muted-foreground text-lg'>
          {pauseInfo?.title || 'Session is currently on hold'}
        </p>
      </motion.div>

      {/* Reason Card */}
      <motion.div
        className='bg-warning/5 border-warning/30 max-w-md space-y-3 rounded-lg border-2 p-6 text-center'
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className='bg-warning/10 inline-flex items-center gap-2 rounded-full px-4 py-1.5'>
          <PauseIcon size={16} className='text-warning' />
          <span className='text-warning text-sm font-medium'>
            {pauseInfo?.title || 'Paused'}
          </span>
        </div>

        <p className='text-muted-foreground text-sm'>
          {pauseInfo?.description || 'The session has been paused by the host.'}
        </p>

        <p className='text-muted-foreground text-xs'>
          Participants can see that the session is paused and will wait for you to resume.
        </p>
      </motion.div>

      {/* Animated Pause Bars */}
      <div className='flex items-center gap-2'>
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            className='bg-warning h-12 w-4 rounded'
            animate={{
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.75,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Resume Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          size='lg'
          onClick={onResume}
          disabled={disabled}
          className='bg-success hover:bg-success/90 gap-2 px-8 py-6 text-lg'
        >
          <Play size={24} />
          Resume Session
        </Button>
      </motion.div>

      {/* Helper Text */}
      <motion.p
        className='text-muted-foreground max-w-md text-center text-xs'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        When you resume, the session will continue from where it was paused. Take your time to
        resolve any issues.
      </motion.p>
    </motion.div>
  );
}

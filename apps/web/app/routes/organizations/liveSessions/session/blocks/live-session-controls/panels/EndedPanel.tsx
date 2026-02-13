import { motion } from 'framer-motion';
import { CheckCircle, Home } from 'lucide-react';

import { Button } from '~/components/ui/button';

interface EndedPanelProps {
  sessionName: string;
  totalQuestions: number;
  onClose: () => void;
  disabled?: boolean;
}

/**
 * Panel shown when session ends (play_state = 'ended')
 * - Final goodbye screen
 * - Session complete message
 * - Option to return to dashboard
 */
export function EndedPanel({
  sessionName,
  totalQuestions,
  onClose,
  disabled = false,
}: EndedPanelProps) {
  return (
    <motion.div
      className='flex min-h-[60vh] flex-col items-center justify-center space-y-8 p-8'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Success Icon */}
      <motion.div
        className='bg-success/10 relative flex h-32 w-32 items-center justify-center rounded-full'
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 180,
          damping: 12,
        }}
      >
        <CheckCircle size={64} className='text-success fill-success/20' />

        {/* Expanding success rings */}
        {[0, 0.3, 0.6].map((delay) => (
          <motion.div
            key={delay}
            className='border-success absolute inset-0 rounded-full border-4'
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{
              duration: 2,
              delay,
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
        <h1 className='text-4xl font-bold'>Session Complete! 🎉</h1>
        <p className='text-muted-foreground text-lg'>{sessionName}</p>
      </motion.div>

      {/* Session Summary */}
      <motion.div
        className='bg-success/5 border-success/30 w-full max-w-md space-y-4 rounded-xl border-2 p-6'
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className='text-center'>
          <p className='text-success mb-2 text-sm font-medium uppercase tracking-wide'>
            Successfully Completed
          </p>
          <p className='text-muted-foreground text-sm'>
            Thank you for hosting this session! All data has been saved.
          </p>
        </div>

        {/* Stats */}
        <div className='bg-muted/50 grid grid-cols-2 gap-4 rounded-lg p-4'>
          <div className='text-center'>
            <p className='text-2xl font-bold'>{totalQuestions}</p>
            <p className='text-muted-foreground text-xs'>Questions</p>
          </div>
          <div className='text-center'>
            <p className='text-success text-2xl font-bold'>✓</p>
            <p className='text-muted-foreground text-xs'>Completed</p>
          </div>
        </div>
      </motion.div>

      {/* What Happens Next */}
      <motion.div
        className='bg-muted/50 max-w-md space-y-3 rounded-lg border p-6'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p className='text-center text-sm font-medium'>What happens now?</p>
        <ul className='text-muted-foreground space-y-2 text-sm'>
          <li className='flex items-start gap-2'>
            <span className='text-success mt-0.5'>✓</span>
            <span>Results and analytics are available in your dashboard</span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='text-success mt-0.5'>✓</span>
            <span>Participant data has been recorded</span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='text-success mt-0.5'>✓</span>
            <span>Session recording is saved (if enabled)</span>
          </li>
        </ul>
      </motion.div>

      {/* Farewell Message */}
      <motion.div
        className='space-y-2 text-center'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className='text-lg font-medium'>Thank you for using Gonasi!</p>
        <p className='text-muted-foreground text-sm'>We hope your session was a success.</p>
      </motion.div>

      {/* Return Home Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Button size='lg' onClick={onClose} disabled={disabled} className='gap-2 px-8 py-6 text-lg'>
          <Home size={24} />
          Return to Dashboard
        </Button>
      </motion.div>

      {/* Final Decoration */}
      <motion.div
        className='flex gap-2'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        {['🎊', '🎉', '✨', '🎈', '🏆'].map((emoji, i) => (
          <motion.span
            key={i}
            className='text-2xl'
            animate={{
              y: [0, -10, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              delay: i * 0.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
}

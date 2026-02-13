import { motion } from 'framer-motion';
import { PlayCircle, Users } from 'lucide-react';

import type { LiveSessionGameState } from '../hooks/useLiveSessionGameState';

import { Button } from '~/components/ui/button';

interface LobbyPanelProps {
  state: Pick<LiveSessionGameState, 'sessionName' | 'sessionCode' | 'blocks'>;
  participantCount?: number;
  onBegin: () => void;
  disabled?: boolean;
}

/**
 * Lobby Panel - Waiting room before game starts
 * playState = 'lobby'
 * Host can start countdown when ready
 */
export function LobbyPanel({
  state,
  participantCount = 0,
  onBegin,
  disabled = false,
}: LobbyPanelProps) {
  return (
    <motion.div
      className='flex min-h-[60vh] flex-col items-center justify-center space-y-8 p-8'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      {/* Lobby Icon with Pulse Animation */}
      <motion.div
        className='bg-success/10 relative flex h-32 w-32 items-center justify-center rounded-full'
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Users size={64} className='text-success' />
        <motion.div
          className='bg-success/20 absolute inset-0 rounded-full'
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      {/* Session Info */}
      <div className='space-y-3 text-center'>
        <h1 className='text-4xl font-bold'>{state.sessionName}</h1>
        <div className='space-y-1'>
          <p className='text-muted-foreground text-lg'>
            Session Code:{' '}
            <span className='text-foreground font-mono font-semibold'>{state.sessionCode}</span>
          </p>
          <p className='text-success text-2xl font-bold'>
            {participantCount} {participantCount === 1 ? 'Participant' : 'Participants'} Ready
          </p>
        </div>
      </div>

      {/* Session Stats */}
      <motion.div
        className='grid w-full max-w-md grid-cols-3 gap-4'
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className='bg-muted/50 rounded-lg p-4 text-center'>
          <p className='text-2xl font-bold'>{state.blocks.length}</p>
          <p className='text-muted-foreground text-xs'>Questions</p>
        </div>
        <div className='bg-muted/50 rounded-lg p-4 text-center'>
          <p className='text-2xl font-bold'>{participantCount}</p>
          <p className='text-muted-foreground text-xs'>Players</p>
        </div>
        <div className='bg-muted/50 rounded-lg p-4 text-center'>
          <p className='text-success text-2xl font-bold'>●</p>
          <p className='text-muted-foreground text-xs'>Live</p>
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        className='bg-primary/5 border-primary/20 max-w-md rounded-lg border p-6 text-center'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className='mb-2 font-medium'>Ready to begin?</p>
        <p className='text-muted-foreground text-sm'>
          All participants are in the lobby. Click "Begin Game" when you're ready to start the
          countdown.
        </p>
      </motion.div>

      {/* Begin Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
      >
        <Button
          size='lg'
          onClick={onBegin}
          disabled={disabled}
          className='gap-2 px-12 py-6 text-lg'
        >
          <PlayCircle size={24} />
          Begin Game
        </Button>
      </motion.div>

      {/* Footer Hint */}
      <motion.p
        className='text-muted-foreground text-xs'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        This will start a 3-second countdown, then the game begins
      </motion.p>
    </motion.div>
  );
}

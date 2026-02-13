import { motion } from 'framer-motion';
import { PlayCircle } from 'lucide-react';

import type { ProfileWithSignedUrl } from '@gonasi/database/profile';

import type { LiveSessionStatus } from '../types';

import { PlainAvatar } from '~/components/avatars';
import { Button } from '~/components/ui/button';

interface NotStartedPanelProps {
  sessionStatus: LiveSessionStatus;
  sessionName: string;
  sessionCode: string;
  participantCount?: number;
  onStartSession: () => void;
  disabled?: boolean;
  user: ProfileWithSignedUrl;
}

/**
 * Panel shown when session hasn't started yet (play_state = NULL)
 * - Status is either 'draft' or 'waiting'
 * - User must start the session to enable play state controls
 */
export function NotStartedPanel({
  sessionStatus,
  sessionName,
  sessionCode,
  participantCount = 0,
  onStartSession,
  disabled = false,
  user,
}: NotStartedPanelProps) {
  const isDraft = sessionStatus === 'draft';
  const isWaiting = sessionStatus === 'waiting';

  return (
    <motion.div
      className='animate-slide-up flex min-h-[60vh] flex-col items-center justify-center gap-8 p-6'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className='text-center'>
        <p className='text-muted-foreground font-display mb-2 text-xs tracking-widest uppercase'>
          Session
        </p>
        <h1 className='text-primary font-display text-3xl font-bold'>{sessionName}</h1>
        <p className='text-muted-foreground flex flex-col items-center space-y-2 pt-4 text-sm'>
          <p className='text-muted-foreground font-display mb-2 text-xs tracking-widest uppercase'>
            Hosted By
          </p>
          <span className='flex items-center space-x-2'>
            <PlainAvatar username={user.username} imageUrl={user.signed_url} size='xs' />
            <span className='text-foreground font-bold'>{user.username}</span>
          </span>
        </p>
      </div>

      {/* Status Message */}
      <motion.div
        className='max-w-md space-y-4 text-center'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {isDraft && (
          <div className='border-warning/50 bg-warning/10 rounded-lg border p-4'>
            <p className='text-warning font-medium'>Session in Draft Mode</p>
            <p className='text-muted-foreground mt-2 text-sm'>
              This session is still being edited. Start the session to begin hosting.
            </p>
          </div>
        )}

        {isWaiting && (
          <div className='border-success/50 bg-success/10 rounded-lg border p-4'>
            <p className='text-success font-medium'>Lobby Open</p>
            <p className='text-muted-foreground mt-2 text-sm'>
              {participantCount > 0
                ? `${participantCount} participant${participantCount !== 1 ? 's' : ''} waiting`
                : 'Waiting for participants to join'}
            </p>
          </div>
        )}

        <div className='bg-muted/50 space-y-2 rounded-lg p-4 text-left'>
          <p className='text-sm font-medium'>What happens when you start?</p>
          <ul className='text-muted-foreground list-inside list-disc space-y-1 text-sm'>
            <li>Session begins (status → active)</li>
            <li>Play state automatically becomes 'lobby'</li>
            <li>You can start controlling play states</li>
            <li>Timers and game mechanics activate</li>
          </ul>
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
      >
        <Button
          size='lg'
          onClick={onStartSession}
          disabled={disabled}
          className='gap-2 px-8 py-6 text-lg'
        >
          <PlayCircle size={24} />
          Start Session
        </Button>
      </motion.div>

      {/* Footer Info */}
      <motion.p
        className='text-muted-foreground text-xs'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {isDraft && 'Transition to waiting first if you want a lobby period'}
        {isWaiting && 'Ready when you are! Start whenever participants have joined'}
      </motion.p>
    </motion.div>
  );
}

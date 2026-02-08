import { NavLink, useParams } from 'react-router';
import { motion } from 'framer-motion';

import type { Database } from '@gonasi/database/schema';

import { Label } from '~/components/ui/label';
import { cn } from '~/lib/utils';

interface IModeToggleProps {
  mode: Database['public']['Enums']['live_session_mode']; // 'test' | 'live'
}

const MotionNavLink = motion(NavLink);

export function ModeToggle({ mode }: IModeToggleProps) {
  const params = useParams();

  const isLive = mode === 'live';
  const nextMode = isLive ? 'test' : 'live';

  const targetPath = `/${params.organizationId}/live-sessions/${params.sessionId}/blocks/update-mode?mode=${nextMode}`;

  return (
    <div>
      <Label>Mode</Label>

      <div className='bg-card/80 flex items-center justify-center space-x-4 rounded-lg px-3 py-2'>
        <span
          className={cn(
            'text-sm font-medium transition-colors',
            !isLive ? 'text-secondary' : 'text-muted-foreground',
          )}
        >
          Test
        </span>

        <MotionNavLink
          to={targetPath}
          className={({ isPending }) =>
            cn(
              'relative flex h-8 w-14 items-center rounded-full border p-1 transition-colors',
              'hover:cursor-pointer',
              isLive ? 'bg-success/30 border-success/40' : 'bg-secondary/30 border-secondary/40',
              isPending && 'animate-pulse cursor-not-allowed',
            )
          }
          role='switch'
          aria-checked={isLive}
          aria-label={`Switch to ${nextMode} mode`}
        >
          <motion.div
            className='bg-foreground h-6 w-6 rounded-full shadow-md'
            layout
            transition={{
              type: 'spring',
              stiffness: 700,
              damping: 30,
            }}
            style={{
              x: isLive ? 24 : 0,
            }}
          />
        </MotionNavLink>

        <span
          className={cn(
            'relative flex items-center text-sm font-medium transition-colors',
            isLive ? 'text-success' : 'text-muted-foreground',
          )}
        >
          {isLive && (
            <span className='bg-success absolute -top-1 -right-1 h-1 w-1 animate-pulse rounded-full' />
          )}
          Live
        </span>
      </div>
    </div>
  );
}

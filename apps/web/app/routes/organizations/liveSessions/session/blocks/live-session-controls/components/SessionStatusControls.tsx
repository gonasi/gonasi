import { Play, Pause, StopCircle } from 'lucide-react';

import type { LiveSessionStatus } from '../types';

import { Button } from '~/components/ui/button';

interface SessionStatusControlsProps {
  currentStatus: LiveSessionStatus;
  onStatusChange: (status: LiveSessionStatus) => void;
  disabled?: boolean;
}

export function SessionStatusControls({
  currentStatus,
  onStatusChange,
  disabled = false,
}: SessionStatusControlsProps) {
  const canStart = currentStatus === 'draft' || currentStatus === 'waiting';
  const canPause = currentStatus === 'active';
  const canResume = currentStatus === 'paused';
  const canEnd = currentStatus === 'active' || currentStatus === 'paused';

  return (
    <div className='space-y-3'>
      <h3 className='text-sm font-semibold'>Session Status</h3>
      <div className='flex items-center gap-2'>
        <div className='flex items-center gap-2'>
          <span className='text-xs font-medium text-muted-foreground'>Current:</span>
          <span className='rounded-full bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary'>
            {currentStatus}
          </span>
        </div>
      </div>

      <div className='flex flex-wrap gap-2'>
        {canStart && (
          <Button
            size='sm'
            variant='success'
            leftIcon={<Play size={16} />}
            onClick={() => onStatusChange('active')}
            disabled={disabled}
          >
            Start Session
          </Button>
        )}

        {canResume && (
          <Button
            size='sm'
            variant='success'
            leftIcon={<Play size={16} />}
            onClick={() => onStatusChange('active')}
            disabled={disabled}
          >
            Resume
          </Button>
        )}

        {canPause && (
          <Button
            size='sm'
            variant='warning'
            leftIcon={<Pause size={16} />}
            onClick={() => onStatusChange('paused')}
            disabled={disabled}
          >
            Pause
          </Button>
        )}

        {canEnd && (
          <Button
            size='sm'
            variant='danger'
            leftIcon={<StopCircle size={16} />}
            onClick={() => onStatusChange('ended')}
            disabled={disabled}
          >
            End Session
          </Button>
        )}
      </div>
    </div>
  );
}

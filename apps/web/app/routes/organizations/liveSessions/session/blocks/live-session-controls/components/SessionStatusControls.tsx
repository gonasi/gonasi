import { Play, Pause, StopCircle } from 'lucide-react';

import type { Database } from '@gonasi/database/schema';

import { PauseReasonModal } from './PauseReasonModal';
import type { LiveSessionStatus } from '../types';

import { Button } from '~/components/ui/button';
import useModal from '~/components/go-editor/hooks/useModal';

type PauseReason = Database['public']['Enums']['live_session_pause_reason'];

interface SessionStatusControlsProps {
  currentStatus: LiveSessionStatus;
  pauseReason?: PauseReason | null;
  onStatusChange: (status: LiveSessionStatus, pauseReason?: PauseReason) => void;
  disabled?: boolean;
}

export function SessionStatusControls({
  currentStatus,
  pauseReason,
  onStatusChange,
  disabled = false,
}: SessionStatusControlsProps) {
  const [modal, showModal] = useModal();

  const canStart = currentStatus === 'draft' || currentStatus === 'waiting';
  const canPause = currentStatus === 'active';
  const canResume = currentStatus === 'paused';
  const canEnd = currentStatus === 'active' || currentStatus === 'paused';

  const handlePause = () => {
    showModal(
      '',
      (onClose) => (
        <PauseReasonModal
          onSelect={(reason) => {
            onStatusChange('paused', reason);
            onClose();
          }}
          onCancel={onClose}
        />
      ),
      '',
      null,
      'lg',
    );
  };

  return (
    <>
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

        {currentStatus === 'paused' && pauseReason && (
          <div className='bg-warning/10 text-warning rounded-lg border border-current p-2 text-xs'>
            <strong>Pause Reason:</strong>{' '}
            <span className='capitalize'>{pauseReason.replace(/_/g, ' ')}</span>
          </div>
        )}

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
              onClick={handlePause}
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
      {modal}
    </>
  );
}

import { Settings, Zap, Hand, Blend } from 'lucide-react';
import { motion } from 'framer-motion';

import type { Database } from '@gonasi/database/schema';

import { Button } from '~/components/ui/button';
import useModal from '~/components/go-editor/hooks/useModal';

type ControlMode = Database['public']['Enums']['live_session_control_mode'];

interface ControlModeSelectorProps {
  currentMode: ControlMode;
  sessionStatus: string;
  onModeChange: (mode: ControlMode) => void;
  disabled?: boolean;
}

const CONTROL_MODES: {
  mode: ControlMode;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  details: string;
  recommended?: boolean;
}[] = [
  {
    mode: 'autoplay',
    label: 'Autoplay',
    icon: Zap,
    description: 'System advances automatically based on timers',
    details: 'Host can only pause/end. Best for fast-paced quizzes with minimal intervention.',
  },
  {
    mode: 'host_driven',
    label: 'Host Driven',
    icon: Hand,
    description: 'Nothing happens automatically. Full manual control',
    details: 'Host controls all transitions. Best for storytelling, classroom settings.',
  },
  {
    mode: 'hybrid',
    label: 'Hybrid',
    icon: Blend,
    description: 'Timers run, but host can override anytime',
    details: 'Best of both worlds. System advances automatically but host can intervene. Recommended default.',
    recommended: true,
  },
];

export function ControlModeSelector({
  currentMode,
  sessionStatus,
  onModeChange,
  disabled = false,
}: ControlModeSelectorProps) {
  const [modal, showModal] = useModal();

  const canChange = sessionStatus === 'waiting' || sessionStatus === 'paused';
  const currentModeConfig = CONTROL_MODES.find((m) => m.mode === currentMode);
  const CurrentModeIcon = currentModeConfig?.icon || Settings;

  const openModeModal = () => {
    showModal(
      'Control Mode',
      (onClose) => (
        <div className='space-y-4'>
          <p className='text-muted-foreground text-sm'>
            Control mode can only be changed when session is <strong>waiting</strong> or{' '}
            <strong>paused</strong>.
          </p>

          <div className='grid grid-cols-1 gap-3'>
            {CONTROL_MODES.map(({ mode, label, icon: Icon, description, details, recommended }) => (
              <motion.button
                key={mode}
                onClick={() => {
                  if (canChange && mode !== currentMode) {
                    onModeChange(mode);
                    onClose();
                  }
                }}
                disabled={!canChange || mode === currentMode}
                className={`relative flex flex-col gap-2 rounded-lg border-2 p-4 text-left transition-all ${
                  mode === currentMode
                    ? 'border-primary bg-primary/5'
                    : canChange
                      ? 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                      : 'cursor-not-allowed border-gray-200 opacity-50'
                }`}
                whileHover={canChange && mode !== currentMode ? { scale: 1.02 } : {}}
                whileTap={canChange && mode !== currentMode ? { scale: 0.98 } : {}}
              >
                {recommended && (
                  <div className='bg-primary text-primary-foreground absolute -top-2 right-4 rounded-full px-2 py-0.5 text-[10px] font-semibold'>
                    RECOMMENDED
                  </div>
                )}
                <div className='flex items-center gap-3'>
                  <div className={mode === currentMode ? 'text-primary' : 'text-muted-foreground'}>
                    <Icon size={24} />
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <h4 className='font-semibold'>{label}</h4>
                      {mode === currentMode && (
                        <span className='text-primary rounded-full border border-current px-2 py-0.5 text-[10px] font-medium'>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className='text-muted-foreground text-xs'>{description}</p>
                  </div>
                </div>
                <p className='text-muted-foreground ml-9 text-xs'>{details}</p>
              </motion.button>
            ))}
          </div>

          {!canChange && (
            <div className='bg-warning/10 text-warning rounded-lg border border-current p-3 text-xs'>
              Control mode is locked during active gameplay. Pause the session to change it.
            </div>
          )}
        </div>
      ),
      '',
      <Settings />,
      'lg',
    );
  };

  return (
    <>
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold'>Control Mode</h3>
          {currentModeConfig?.recommended && (
            <span className='text-success rounded-full border border-current px-2 py-0.5 text-[9px] font-medium'>
              RECOMMENDED
            </span>
          )}
        </div>

        <Button
          size='sm'
          variant='outline'
          leftIcon={<CurrentModeIcon size={16} />}
          onClick={openModeModal}
          disabled={disabled}
          className='w-full justify-start'
        >
          <div className='flex flex-col items-start gap-0.5'>
            <span className='font-medium'>{currentModeConfig?.label}</span>
            <span className='text-muted-foreground text-[10px] font-normal'>
              {currentModeConfig?.description}
            </span>
          </div>
        </Button>

        {!canChange && (
          <p className='text-warning text-[10px]'>
            Can only change in <strong>waiting</strong> or <strong>paused</strong> status
          </p>
        )}
      </div>
      {modal}
    </>
  );
}

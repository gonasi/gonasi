import { MessageCircle, MessageSquare, Smile, VolumeX, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

import type { Database } from '@gonasi/database/schema';

import { Button } from '~/components/ui/button';
import useModal from '~/components/go-editor/hooks/useModal';

type ChatMode = Database['public']['Enums']['live_session_chat_mode'];

interface ChatModeControlsProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  disabled?: boolean;
  pauseReason?: string;
}

const CHAT_MODES: {
  mode: ChatMode;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  whenToUse: string;
}[] = [
  {
    mode: 'open',
    label: 'Open Chat',
    icon: MessageCircle,
    description: 'Full chat enabled. Everyone can send messages.',
    whenToUse: 'Best during results, leaderboard, breaks',
  },
  {
    mode: 'reactions_only',
    label: 'Reactions Only',
    icon: Smile,
    description: 'Only emoji reactions allowed. No text messages.',
    whenToUse: 'Best during active questions (keeps focus)',
  },
  {
    mode: 'host_only',
    label: 'Host Only',
    icon: Crown,
    description: 'Only facilitators can send messages. Participants can read.',
    whenToUse: 'Announcements, instructions, host talking',
  },
  {
    mode: 'muted',
    label: 'Muted',
    icon: VolumeX,
    description: 'No interaction allowed. Read-only mode.',
    whenToUse: 'Critical moments, moderation, host segment',
  },
];

export function ChatModeControls({
  currentMode,
  onModeChange,
  disabled = false,
  pauseReason,
}: ChatModeControlsProps) {
  const [modal, showModal] = useModal();

  const isLockedByModeration = pauseReason === 'moderation';
  const currentModeConfig = CHAT_MODES.find((m) => m.mode === currentMode);
  const CurrentModeIcon = currentModeConfig?.icon || MessageSquare;

  const openModeModal = () => {
    showModal(
      'Chat Control',
      (onClose) => (
        <div className='space-y-4'>
          <p className='text-muted-foreground text-sm'>
            Control chat interaction levels during the session. Chat mode can be changed anytime.
          </p>

          {isLockedByModeration && (
            <div className='bg-warning/10 text-warning rounded-lg border border-current p-3 text-sm'>
              <strong>⚠️ Locked for Moderation</strong>
              <p className='mt-1 text-xs'>Chat is automatically muted when paused for moderation.</p>
            </div>
          )}

          <div className='grid grid-cols-1 gap-3'>
            {CHAT_MODES.map(({ mode, label, icon: Icon, description, whenToUse }) => (
              <motion.button
                key={mode}
                onClick={() => {
                  if (!isLockedByModeration && mode !== currentMode) {
                    onModeChange(mode);
                    onClose();
                  }
                }}
                disabled={isLockedByModeration || mode === currentMode}
                className={`flex flex-col gap-2 rounded-lg border-2 p-4 text-left transition-all ${
                  mode === currentMode
                    ? 'border-primary bg-primary/5'
                    : isLockedByModeration
                      ? 'cursor-not-allowed border-gray-200 opacity-50'
                      : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                }`}
                whileHover={!isLockedByModeration && mode !== currentMode ? { scale: 1.02 } : {}}
                whileTap={!isLockedByModeration && mode !== currentMode ? { scale: 0.98 } : {}}
              >
                <div className='flex items-center gap-3'>
                  <div className={mode === currentMode ? 'text-primary' : 'text-muted-foreground'}>
                    <Icon size={20} />
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
                <p className='text-muted-foreground ml-8 text-xs'>
                  <strong>When to use:</strong> {whenToUse}
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      ),
      '',
      <MessageSquare />,
      'lg',
    );
  };

  return (
    <>
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold'>Chat Control</h3>
          {isLockedByModeration && (
            <span className='text-warning rounded-full border border-current px-2 py-0.5 text-[9px] font-medium'>
              LOCKED
            </span>
          )}
        </div>

        <Button
          size='sm'
          variant='outline'
          leftIcon={<CurrentModeIcon size={16} />}
          onClick={openModeModal}
          disabled={disabled || isLockedByModeration}
          className='w-full justify-start'
        >
          <div className='flex flex-col items-start gap-0.5'>
            <span className='font-medium'>{currentModeConfig?.label}</span>
            <span className='text-muted-foreground text-[10px] font-normal'>
              {currentModeConfig?.description}
            </span>
          </div>
        </Button>

        {isLockedByModeration && (
          <p className='text-warning text-[10px]'>
            Auto-muted during moderation pause. Resume session to unlock.
          </p>
        )}
      </div>
      {modal}
    </>
  );
}

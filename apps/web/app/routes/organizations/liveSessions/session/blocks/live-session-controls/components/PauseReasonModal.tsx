import { AlertTriangle, Hand, Settings, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

import type { Database } from '@gonasi/database/schema';

import { Button } from '~/components/ui/button';

type PauseReason = Database['public']['Enums']['live_session_pause_reason'];

interface PauseReasonModalProps {
  onSelect: (reason: PauseReason) => void;
  onCancel: () => void;
}

const PAUSE_REASONS: {
  reason: PauseReason;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  uiMessage: string;
  autoActions?: string;
}[] = [
  {
    reason: 'host_hold',
    label: 'Host Hold',
    icon: Hand,
    description: 'Taking a intentional break to talk or manage the session',
    uiMessage: 'Participants see: "Host is pausing. We\'ll resume shortly."',
  },
  {
    reason: 'technical_issue',
    label: 'Technical Issue',
    icon: Wrench,
    description: 'Network, server, or technical problem requires pause',
    uiMessage: 'Participants see: "Technical difficulty. Please stand by."',
  },
  {
    reason: 'moderation',
    label: 'Moderation',
    icon: AlertTriangle,
    description: 'Handling inappropriate behavior or content',
    uiMessage: 'Participants see: "Session paused for moderation."',
    autoActions: 'Chat automatically locked to muted mode',
  },
  {
    reason: 'system',
    label: 'System Pause',
    icon: Settings,
    description: 'System-initiated pause (auto-recovery, timeout)',
    uiMessage: 'Participants see: "System pause. Reconnecting..."',
  },
];

export function PauseReasonModal({ onSelect, onCancel }: PauseReasonModalProps) {
  return (
    <div className='space-y-4'>
      <div>
        <h3 className='text-lg font-semibold'>Why are you pausing?</h3>
        <p className='text-muted-foreground mt-1 text-sm'>
          This helps provide appropriate messaging to participants and analytics.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-3'>
        {PAUSE_REASONS.map(({ reason, label, icon: Icon, description, uiMessage, autoActions }) => (
          <motion.button
            key={reason}
            onClick={() => onSelect(reason)}
            className='hover:border-primary/50 flex flex-col gap-2 rounded-lg border-2 border-gray-200 p-4 text-left transition-all hover:bg-gray-50'
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className='flex items-start gap-3'>
              <div className='text-muted-foreground mt-0.5'>
                <Icon size={20} />
              </div>
              <div className='flex-1'>
                <h4 className='font-semibold'>{label}</h4>
                <p className='text-muted-foreground mt-0.5 text-xs'>{description}</p>
              </div>
            </div>

            <div className='ml-8 space-y-1'>
              <p className='text-primary text-xs font-medium'>{uiMessage}</p>
              {autoActions && (
                <p className='text-warning text-xs'>
                  <strong>Auto-action:</strong> {autoActions}
                </p>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      <div className='flex justify-end gap-2'>
        <Button size='sm' variant='ghost' onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

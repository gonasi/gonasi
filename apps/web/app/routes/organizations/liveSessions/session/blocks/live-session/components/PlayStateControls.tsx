import {
  Users,
  Trophy,
  PlayCircle,
  Lock,
  BarChart3,
  Award,
  Coffee,
  Gift,
  Medal,
  Power,
} from 'lucide-react';

import type { LiveSessionPlayState } from '../types';

import { Button } from '~/components/ui/button';

interface PlayStateControlsProps {
  currentPlayState: LiveSessionPlayState;
  onPlayStateChange: (playState: LiveSessionPlayState, blockId?: string) => void;
  currentBlockId?: string;
  disabled?: boolean;
}

const PLAY_STATES: Array<{
  state: LiveSessionPlayState;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  description: string;
}> = [
  {
    state: 'lobby',
    label: 'Lobby',
    icon: Users,
    description: 'Waiting room before session starts',
  },
  {
    state: 'intro',
    label: 'Intro',
    icon: PlayCircle,
    description: 'Welcome screen with rules',
  },
  {
    state: 'question_active',
    label: 'Question Active',
    icon: PlayCircle,
    description: 'Question visible and accepting responses',
  },
  {
    state: 'question_locked',
    label: 'Question Locked',
    icon: Lock,
    description: 'Answers locked, suspense moment',
  },
  {
    state: 'question_results',
    label: 'Question Results',
    icon: BarChart3,
    description: 'Show correct answer and explanation',
  },
  {
    state: 'leaderboard',
    label: 'Leaderboard',
    icon: Trophy,
    description: 'Display rankings and scores',
  },
  {
    state: 'intermission',
    label: 'Intermission',
    icon: Coffee,
    description: 'Break before next question',
  },
  {
    state: 'prizes',
    label: 'Prizes',
    icon: Gift,
    description: 'Prize breakdown screen',
  },
  {
    state: 'final_results',
    label: 'Final Results',
    icon: Medal,
    description: 'Final winners and rankings',
  },
  {
    state: 'ended',
    label: 'Ended',
    icon: Power,
    description: 'Session over, goodbye screen',
  },
];

export function PlayStateControls({
  currentPlayState,
  onPlayStateChange,
  currentBlockId,
  disabled = false,
}: PlayStateControlsProps) {
  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold'>Play State</h3>
        <div className='flex items-center gap-2'>
          <span className='text-xs font-medium text-muted-foreground'>Current:</span>
          <span className='rounded-full bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary'>
            {currentPlayState.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
        {PLAY_STATES.map(({ state, label, icon: Icon, description }) => {
          const isActive = currentPlayState === state;

          return (
            <Button
              key={state}
              size='sm'
              variant={isActive ? 'default' : 'secondary'}
              className='flex flex-col items-start justify-start h-auto py-3'
              onClick={() => onPlayStateChange(state, currentBlockId)}
              disabled={disabled || isActive}
            >
              <div className='flex w-full items-center gap-2'>
                <Icon size={16} />
                <span className='text-xs font-medium'>{label}</span>
              </div>
              <span className='mt-1 text-left text-[10px] text-muted-foreground'>
                {description}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

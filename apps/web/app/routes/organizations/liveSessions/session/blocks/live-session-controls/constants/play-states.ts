import {
  BarChart3,
  Coffee,
  Gift,
  Lock,
  Medal,
  PlayCircle,
  Power,
  Trophy,
  Users,
} from 'lucide-react';

import type { LiveSessionPlayState } from '../types';

export const PLAY_STATES: {
  state: LiveSessionPlayState;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  description: string;
}[] = [
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

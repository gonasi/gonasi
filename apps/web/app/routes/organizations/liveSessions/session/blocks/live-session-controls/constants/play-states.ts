import {
  BarChart3,
  Clock,
  Coffee,
  Gift,
  Lock,
  Medal,
  Mic,
  PlayCircle,
  Power,
  SkipForward,
  Timer,
  Trophy,
  Users,
} from 'lucide-react';

import type { LiveSessionPlayState } from '../types';

export const PLAY_STATES: {
  state: LiveSessionPlayState;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  description: string;
  category?: 'normal' | 'special' | 'host-control';
}[] = [
  {
    state: 'lobby',
    label: 'Lobby',
    icon: Users,
    description: 'Waiting room before session starts',
    category: 'normal',
  },
  {
    state: 'countdown',
    label: 'Countdown',
    icon: Timer,
    description: '3...2...1...GO! Builds anticipation',
    category: 'special',
  },
  {
    state: 'intro',
    label: 'Intro',
    icon: PlayCircle,
    description: 'Welcome screen with rules',
    category: 'normal',
  },
  {
    state: 'question_active',
    label: 'Question Active',
    icon: PlayCircle,
    description: 'Question visible and accepting responses',
    category: 'normal',
  },
  {
    state: 'question_soft_locked',
    label: 'Soft Locked (Grace Period)',
    icon: Timer,
    description: "Time's up! Grace period (1-3s) for late responses",
    category: 'special',
  },
  {
    state: 'question_locked',
    label: 'Question Locked',
    icon: Lock,
    description: 'Answers fully locked, suspense moment',
    category: 'normal',
  },
  {
    state: 'question_results',
    label: 'Question Results',
    icon: BarChart3,
    description: 'Show correct answer and explanation',
    category: 'normal',
  },
  {
    state: 'leaderboard',
    label: 'Leaderboard',
    icon: Trophy,
    description: 'Display rankings and scores',
    category: 'normal',
  },
  {
    state: 'intermission',
    label: 'Intermission',
    icon: Coffee,
    description: 'Break before next question',
    category: 'normal',
  },
  {
    state: 'host_segment',
    label: 'Host Segment',
    icon: Mic,
    description: 'Host talking to crowd (no submissions, timers paused)',
    category: 'host-control',
  },
  {
    state: 'block_skipped',
    label: 'Block Skipped',
    icon: SkipForward,
    description: 'Question skipped, shown briefly before moving on',
    category: 'special',
  },
  {
    state: 'prizes',
    label: 'Prizes',
    icon: Gift,
    description: 'Prize breakdown screen',
    category: 'normal',
  },
  {
    state: 'final_results',
    label: 'Final Results',
    icon: Medal,
    description: 'Final winners and rankings',
    category: 'normal',
  },
  {
    state: 'ended',
    label: 'Ended',
    icon: Power,
    description: 'Session over, goodbye screen',
    category: 'normal',
  },
  {
    state: 'paused',
    label: 'Paused',
    icon: Clock,
    description: 'Session temporarily halted',
    category: 'host-control',
  },
];

/**
 * Valid play state transitions
 * Maps current state to allowed next states
 * Matches backend validation in updateLiveSessionPlayState.ts
 *
 * BUSINESS RULES:
 * - lobby: Can only start countdown or pause before actual start (cannot end before starting)
 * - countdown: Builds anticipation (3...2...1...GO!), leads to intro or first question
 * - Can only reach 'ended' from active gameplay states (not from lobby/countdown)
 * - paused: Can resume to most states except lobby/countdown (can't restart)
 * - ended: Terminal state, no transitions
 */
export const VALID_PLAY_STATE_TRANSITIONS: Record<
  LiveSessionPlayState,
  LiveSessionPlayState[]
> = {
  // Pre-game states (before session truly starts)
  lobby: ['countdown', 'host_segment', 'paused'], // Can't jump to questions or end before starting
  countdown: ['intro', 'question_active', 'host_segment', 'paused'], // Anticipation builds, then game starts
  intro: ['question_active', 'host_segment', 'paused', 'ended'], // Welcome, then begin

  // Question flow states
  question_active: [
    'question_soft_locked',
    'question_locked',
    'question_results',
    'block_skipped',
    'paused',
    'ended',
  ],
  question_soft_locked: ['question_locked', 'question_results', 'paused', 'ended'],
  question_locked: ['question_results', 'paused', 'ended'],
  question_results: ['leaderboard', 'intermission', 'host_segment', 'paused', 'ended'],

  // Between questions states
  leaderboard: [
    'intermission',
    'host_segment',
    'prizes',
    'final_results',
    'question_active',
    'paused',
    'ended',
  ],
  intermission: ['question_active', 'host_segment', 'prizes', 'final_results', 'paused', 'ended'],

  // Special states
  paused: [
    // Can resume to any state EXCEPT lobby and countdown (can't restart the session)
    'intro',
    'question_active',
    'question_soft_locked',
    'question_locked',
    'question_results',
    'leaderboard',
    'intermission',
    'host_segment',
    'block_skipped',
    'prizes',
    'final_results',
    'ended',
  ],
  host_segment: [
    'countdown',
    'intro',
    'question_active',
    'question_results',
    'leaderboard',
    'intermission',
    'block_skipped',
    'prizes',
    'final_results',
    'paused',
    'ended',
  ], // Host can transition to most states
  block_skipped: ['intermission', 'question_active', 'host_segment', 'final_results', 'paused', 'ended'],

  // End-game states
  prizes: ['leaderboard', 'final_results', 'host_segment', 'paused', 'ended'],
  final_results: ['ended', 'paused'], // Can only end or pause from here
  ended: [], // Terminal state - no transitions allowed
};

/**
 * Get valid play state transitions for the current state
 * @param currentState - The current play state
 * @returns Array of valid next play states
 */
export function getValidPlayStateTransitions(
  currentState: LiveSessionPlayState,
): LiveSessionPlayState[] {
  return VALID_PLAY_STATE_TRANSITIONS[currentState] || [];
}

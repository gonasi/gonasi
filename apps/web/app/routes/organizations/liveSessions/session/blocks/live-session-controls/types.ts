import type { Database } from '@gonasi/database/schema';

// Live Session Enum Types (inferred from database schema)

export type LiveSessionStatus = Database['public']['Enums']['live_session_status'];

export type LiveSessionPlayState = Database['public']['Enums']['live_session_play_state'];

export type LiveSessionPlayMode = Database['public']['Enums']['live_session_play_mode'];

export type LiveSessionMode = Database['public']['Enums']['live_session_mode'];

export type LiveSessionBlockStatus = Database['public']['Enums']['live_session_block_status'];

// Broadcast Event Types

export type BroadcastEventType =
  | 'session_state_change'
  | 'play_state_change'
  | 'block_state_change'
  | 'participant_update'
  | 'timer_update';

export interface SessionStateChangePayload {
  sessionId: string;
  status: LiveSessionStatus;
  timestamp: string;
}

export interface PlayStateChangePayload {
  sessionId: string;
  playState: LiveSessionPlayState;
  currentBlockId?: string;
  timestamp: string;
}

export interface BlockStateChangePayload {
  sessionId: string;
  blockId: string;
  blockStatus: LiveSessionBlockStatus;
  timestamp: string;
}

export interface TimerUpdatePayload {
  sessionId: string;
  blockId?: string;
  timeRemaining: number;
  timestamp: string;
}

export type BroadcastPayload =
  | SessionStateChangePayload
  | PlayStateChangePayload
  | BlockStateChangePayload
  | TimerUpdatePayload;

// Channel Event Type
export interface LiveSessionBroadcastEvent {
  type: 'broadcast';
  event: BroadcastEventType;
  payload: BroadcastPayload;
}

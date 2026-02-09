import { useEffect, useState } from 'react';
import type { RealtimeChannel, RealtimePostgresUpdatePayload } from '@supabase/supabase-js';

import type { Database } from '@gonasi/database/schema';

import { supabaseClient } from '~/lib/supabase/supabaseClient';

interface UseParticipantRealtimeProps {
  sessionId: string;
  mode: 'test' | 'live';
}

interface SessionState {
  status: Database['public']['Enums']['live_session_status'];
  playState: Database['public']['Enums']['live_session_play_state'];
  currentBlockId: string | null;
}

interface UseParticipantRealtimeReturn {
  channel: RealtimeChannel | null;
  isConnected: boolean;
  sessionState: SessionState | null;
}

/**
 * Hook for participants to subscribe to live session state changes via Postgres Changes.
 * Listens to updates on the live_sessions table to receive facilitator-triggered state changes.
 */
export function useParticipantRealtime({
  sessionId,
  mode,
}: UseParticipantRealtimeProps): UseParticipantRealtimeReturn {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);

  // Create channel name based on mode
  const channelName =
    mode === 'test'
      ? `test-session:${sessionId}:${Date.now()}` // Unique test session
      : `participant:${sessionId}`;

  useEffect(() => {
    // Create channel and subscribe to postgres changes
    const realtimeChannel = supabaseClient.channel(channelName);

    // Listen to updates on the live_sessions table for this specific session
    realtimeChannel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'live_sessions',
        filter: `id=eq.${sessionId}`,
      },
      (payload: RealtimePostgresUpdatePayload<any>) => {
        console.log('[Participant Realtime] Session updated:', payload);
        const newRecord = payload.new;

        setSessionState({
          status: newRecord.status,
          playState: newRecord.play_state,
          currentBlockId: newRecord.current_block_id,
        });
      },
    );

    // Subscribe to the channel
    realtimeChannel.subscribe((status) => {
      console.log('[Participant Realtime] Channel status:', status);
      setIsConnected(status === 'SUBSCRIBED');
    });

    setChannel(realtimeChannel);

    // Cleanup on unmount
    return () => {
      realtimeChannel.unsubscribe();
      setChannel(null);
      setIsConnected(false);
    };
  }, [channelName, sessionId]);

  return {
    channel,
    isConnected,
    sessionState,
  };
}

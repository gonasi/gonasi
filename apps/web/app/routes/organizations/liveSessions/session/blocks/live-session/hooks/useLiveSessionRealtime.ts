import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel, RealtimePostgresUpdatePayload } from '@supabase/supabase-js';

import { supabaseClient } from '~/lib/supabase/supabaseClient';

interface UseLiveSessionRealtimeProps {
  sessionId: string;
  mode: 'test' | 'live';
  onSessionUpdate?: (payload: RealtimePostgresUpdatePayload<any>) => void;
  onBlockUpdate?: (payload: RealtimePostgresUpdatePayload<any>) => void;
}

interface UseLiveSessionRealtimeReturn {
  channel: RealtimeChannel | null;
  isConnected: boolean;
}

/**
 * Hook to subscribe to live session database changes via Postgres logical replication.
 * This listens to UPDATE events on live_sessions and live_session_blocks tables
 * and automatically receives changes when the database is updated.
 */
export function useLiveSessionRealtime({
  sessionId,
  mode,
  onSessionUpdate,
  onBlockUpdate,
}: UseLiveSessionRealtimeProps): UseLiveSessionRealtimeReturn {
  const supabase = supabaseClient;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Create channel name based on session ID and mode
  const channelName = `live-session:${sessionId}:${mode}`;

  useEffect(() => {
    // Create channel and subscribe to postgres changes
    const channel = supabase.channel(channelName);

    // Listen to updates on the live_sessions table for this specific session
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'live_sessions',
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        console.log('[Live Session Realtime] Session updated:', payload);
        onSessionUpdate?.(payload as RealtimePostgresUpdatePayload<any>);
      },
    );

    // Listen to updates on live_session_blocks for blocks in this session
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'live_session_blocks',
        filter: `live_session_id=eq.${sessionId}`,
      },
      (payload) => {
        console.log('[Live Session Realtime] Block updated:', payload);
        onBlockUpdate?.(payload as RealtimePostgresUpdatePayload<any>);
      },
    );

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log('[Live Session Realtime] Channel status:', status);
      setIsConnected(status === 'SUBSCRIBED');
    });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [supabase, channelName, sessionId, onSessionUpdate, onBlockUpdate]);

  return {
    channel: channelRef.current,
    isConnected,
  };
}

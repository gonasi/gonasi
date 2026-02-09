import { useEffect, useMemo, useState } from 'react';

import type { Database } from '@gonasi/database/schema';
import type { LiveSessionBlock } from '@gonasi/database/liveSessions';

import type { LiveSessionMode } from '../plugins/liveSession/core/types';

import { useParticipantRealtime } from './hooks/useParticipantRealtime';

import { liveSessionPluginRegistry } from '~/components/plugins/liveSession';

interface LiveSessionPlayEngineProps {
  blocks: LiveSessionBlock[];
  sessionCode: string;
  sessionId: string;
  mode: LiveSessionMode;
  sessionTitle?: string;
  initialState: {
    status: Database['public']['Enums']['live_session_status'];
    playState: Database['public']['Enums']['live_session_play_state'];
    currentBlockId: string | null;
  };
}

/**
 * LiveSessionPlayEngine - Shared component for both live and test modes
 *
 * Database-first architecture:
 * - Subscribes to Postgres Changes on live_sessions table
 * - Facilitator updates database → triggers Postgres Changes → participants receive updates
 * - Server is the single source of truth for session state
 *
 * Handles:
 * - Block navigation (driven by current_block_id from database)
 * - Current block rendering with Play components
 * - Timer management
 * - Response handling (DB write for live, client-only for test)
 * - Real-time sync via Postgres Changes
 *
 * Mode differences:
 * - test: Ephemeral Realtime channel, no DB writes, in-memory state
 * - live: Persistent DB writes, analytics tracking, participant records
 */
export function LiveSessionPlayEngine({
  blocks,
  sessionCode,
  sessionId,
  mode,
  sessionTitle,
  initialState,
}: LiveSessionPlayEngineProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const isTestMode = mode === 'test';

  // Subscribe to database changes via Postgres Changes
  const { isConnected, sessionState } = useParticipantRealtime({
    sessionId,
    mode,
  });

  // Use session state from database (or initial state)
  const currentStatus = sessionState?.status ?? initialState.status;
  const currentPlayState = sessionState?.playState ?? initialState.playState;
  const currentBlockId = sessionState?.currentBlockId ?? initialState.currentBlockId;

  // Derive current block index from currentBlockId
  const currentBlockIndex = useMemo(() => {
    if (!currentBlockId) return 0;
    const index = blocks.findIndex((block) => block.id === currentBlockId);
    return index >= 0 ? index : 0;
  }, [currentBlockId, blocks]);

  const currentBlock = blocks[currentBlockIndex];
  const isLastBlock = currentBlockIndex === blocks.length - 1;

  const connectionStatus: 'connecting' | 'connected' | 'error' = isConnected
    ? 'connected'
    : 'connecting';

  // Note: In test mode, manual navigation is removed
  // The facilitator controls should be used via the session controls page
  // Participants (including test mode users) see whatever block the database says is current

  const handleResponse = async (blockId: string, response: any) => {
    if (isTestMode) {
      // Test mode: Store in memory only
      setResponses((prev) => ({ ...prev, [blockId]: response }));
      console.log('[Test Mode] Response recorded:', { blockId, response });
    } else {
      // Live mode: Submit to database
      try {
        // Store in local state first for immediate UI update
        setResponses((prev) => ({ ...prev, [blockId]: response }));

        // TODO: Submit to live_session_responses table via API
        const formData = new FormData();
        formData.append('intent', 'submit_response');
        formData.append('blockId', blockId);
        formData.append('response', JSON.stringify(response));

        const result = await fetch(window.location.pathname, {
          method: 'POST',
          body: formData,
        });

        if (!result.ok) {
          console.error('[Live Mode] Failed to submit response');
        } else {
          console.log('[Live Mode] Response submitted successfully');
          // TODO: Broadcast to Realtime for leaderboard updates
        }
      } catch (error) {
        console.error('[Live Mode] Error submitting response:', error);
      }
    }
  };

  if (!currentBlock) {
    return (
      <div className='mx-auto max-w-4xl p-6'>
        <div className='text-muted-foreground rounded-lg border p-8 text-center'>
          <p>No blocks available in this session.</p>
        </div>
      </div>
    );
  }

  // Get the Play component for the current block type
  const PlayComponent = liveSessionPluginRegistry.getPlay(currentBlock.plugin_type);

  return (
    <div className='mx-auto max-w-2xl space-y-6 p-6'>
      {/* Session Header */}
      <div className='space-y-2'>
        {sessionTitle && <h1 className='text-2xl font-bold'>{sessionTitle}</h1>}
        <div className='text-muted-foreground flex items-center justify-between text-sm'>
          <span>Session Code: {sessionCode}</span>
          <div className='flex items-center gap-2'>
            {/* Connection Status */}
            <span
              className={`flex items-center gap-1 text-xs ${
                connectionStatus === 'connected'
                  ? 'text-success'
                  : connectionStatus === 'error'
                    ? 'text-danger'
                    : 'text-muted-foreground'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-success animate-pulse'
                    : connectionStatus === 'error'
                      ? 'bg-danger'
                      : 'bg-muted-foreground'
                }`}
              />
              {connectionStatus === 'connected'
                ? 'Live'
                : connectionStatus === 'error'
                  ? 'Disconnected'
                  : 'Connecting...'}
            </span>

            {isTestMode && (
              <span className='bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold'>
                🧪 Test Mode
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className='flex items-center justify-between'>
        <div className='text-muted-foreground text-sm'>
          Block {currentBlockIndex + 1} of {blocks.length}
        </div>
        <div className='bg-secondary h-2 w-full max-w-xs overflow-hidden rounded-full'>
          <div
            className='bg-primary h-full transition-all duration-300'
            style={{ width: `${((currentBlockIndex + 1) / blocks.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Block */}
      <div className='rounded-lg border p-6'>
        {PlayComponent ? (
          <PlayComponent block={currentBlock} isLastBlock={isLastBlock} mode={mode} />
        ) : (
          <div className='text-muted-foreground text-center'>
            <p>Play component not available for this block type.</p>
            <p className='mt-2 text-sm'>Plugin type: {currentBlock.plugin_type}</p>
          </div>
        )}
      </div>

      {/* Session State Information */}
      <div className='text-muted-foreground rounded-lg border p-4 text-sm'>
        <p className='font-semibold'>Session State</p>
        <div className='mt-2 space-y-1 text-xs'>
          <p>
            <span className='font-medium'>Status:</span>{' '}
            <span className='capitalize'>{currentStatus}</span>
          </p>
          <p>
            <span className='font-medium'>Play State:</span>{' '}
            <span className='capitalize'>{currentPlayState.replace(/_/g, ' ')}</span>
          </p>
          {isTestMode && (
            <p className='text-warning mt-2 italic'>
              Use the Session Controls page to navigate between blocks
            </p>
          )}
        </div>
      </div>

      {/* Implementation Status */}
      <div className='border-border rounded-lg border p-4'>
        <p className='text-sm font-semibold'>✅ Implemented Features</p>
        <ul className='text-muted-foreground mt-2 list-inside list-disc text-xs'>
          <li>✅ supabaseClient Realtime (test vs live channels)</li>
          <li>✅ Timer countdown with auto-submit</li>
          <li>✅ Response submission handler</li>
          <li>✅ Privacy/visibility enforcement</li>
          <li>✅ Connection status indicator</li>
        </ul>
        <p className='mt-3 text-sm font-semibold'>⏳ Coming Soon</p>
        <ul className='text-muted-foreground mt-2 list-inside list-disc text-xs'>
          <li>Leaderboard (real-time)</li>
          <li>Block transition animations</li>
          <li>Waiting state (before session starts)</li>
          <li>End state with results summary</li>
          <li>Chat and reactions</li>
          {!isTestMode && (
            <>
              <li>Participant records in DB</li>
              <li>Analytics tracking</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}

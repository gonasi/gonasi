import { useCallback, useState } from 'react';
import { data as routerData, useFetcher, useOutletContext } from 'react-router';
import { TvMinimalPlay, Wifi, WifiOff } from 'lucide-react';
import { dataWithError } from 'remix-toast';

import {
  updateLiveSessionBlockStatus,
  updateLiveSessionPlayState,
  updateLiveSessionStatus,
} from '@gonasi/database/liveSessions';
import type { Database } from '@gonasi/database/schema';

import type { Route } from './+types/live-session-index';
import { BlockControls } from './components/BlockControls';
import { PlayStateControls } from './components/PlayStateControls';
import { SessionStatusControls } from './components/SessionStatusControls';
import { useLiveSessionRealtime } from './hooks/useLiveSessionRealtime';
import type { LiveSessionBlocksOutletContext } from '../types';
import type { LiveSessionBlockStatus, LiveSessionPlayState, LiveSessionStatus } from './types';

import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';

export function meta() {
  return [
    { title: 'Control Live Session • Gonasi' },
    {
      name: 'description',
      content: 'Control the flow of live session',
    },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const { supabase, headers } = createClient(request);
  const formData = await request.formData();

  const intent = formData.get('intent') as string;

  try {
    switch (intent) {
      case 'update-session-status': {
        const sessionId = formData.get('sessionId') as string;
        const status = formData.get('status') as Database['public']['Enums']['live_session_status'];

        const result = await updateLiveSessionStatus({
          supabase,
          sessionId,
          status,
        });

        if (!result.success) {
          return dataWithError(null, result.error, { headers });
        }

        return routerData({ success: true }, { headers });
      }

      case 'update-play-state': {
        const sessionId = formData.get('sessionId') as string;
        const playState = formData.get(
          'playState',
        ) as Database['public']['Enums']['live_session_play_state'];
        const currentBlockId = formData.get('currentBlockId') as string | undefined;

        const result = await updateLiveSessionPlayState({
          supabase,
          sessionId,
          playState,
          currentBlockId: currentBlockId || undefined,
        });

        if (!result.success) {
          return dataWithError(null, result.error, { headers });
        }

        return routerData({ success: true }, { headers });
      }

      case 'update-block-status': {
        const blockId = formData.get('blockId') as string;
        const blockStatus = formData.get(
          'status',
        ) as Database['public']['Enums']['live_session_block_status'];

        const result = await updateLiveSessionBlockStatus({
          supabase,
          blockId,
          status: blockStatus,
        });

        if (!result.success) {
          return dataWithError(null, result.error, { headers });
        }

        return routerData({ success: true }, { headers });
      }

      default:
        return dataWithError(null, 'Invalid intent', { headers });
    }
  } catch (error) {
    console.error('[Live Session Actions] Error:', error);
    return dataWithError(null, 'An unexpected error occurred', { headers });
  }
}

export default function LiveSessionIndex({ params }: Route.ComponentProps) {
  const { organizationId, sessionId } = params;
  const { session, blocks, sessionCode, mode } = useOutletContext<LiveSessionBlocksOutletContext>();
  const fetcher = useFetcher();

  // Local state for current session controls (synced with realtime updates)
  const [currentSessionStatus, setCurrentSessionStatus] = useState<LiveSessionStatus>(
    session.status as LiveSessionStatus,
  );
  const [currentPlayState, setCurrentPlayState] = useState<LiveSessionPlayState>(
    session.play_state as LiveSessionPlayState,
  );
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);

  const closeRoute = `/${organizationId}/live-sessions/${sessionId}/blocks`;

  // Handle realtime session updates
  const handleSessionUpdate = useCallback((payload: any) => {
    const newRecord = payload.new;
    if (newRecord.status) {
      setCurrentSessionStatus(newRecord.status);
    }
    if (newRecord.play_state) {
      setCurrentPlayState(newRecord.play_state);
    }
  }, []);

  // Handle realtime block updates
  const handleBlockUpdate = useCallback((payload: any) => {
    // Block updates will be reflected in the blocks array from parent
    // which will trigger a re-render
    console.log('[Live Session] Block updated:', payload);
  }, []);

  // Initialize realtime subscription
  const { isConnected } = useLiveSessionRealtime({
    sessionId,
    mode,
    onSessionUpdate: handleSessionUpdate,
    onBlockUpdate: handleBlockUpdate,
  });

  // Handle session status change - updates database which triggers realtime
  const handleSessionStatusChange = (status: LiveSessionStatus) => {
    const formData = new FormData();
    formData.append('intent', 'update-session-status');
    formData.append('sessionId', sessionId);
    formData.append('status', status);

    fetcher.submit(formData, { method: 'POST' });
  };

  // Handle play state change - updates database which triggers realtime
  const handlePlayStateChange = (playState: LiveSessionPlayState, blockId?: string) => {
    const formData = new FormData();
    formData.append('intent', 'update-play-state');
    formData.append('sessionId', sessionId);
    formData.append('playState', playState);
    if (blockId) {
      formData.append('currentBlockId', blockId);
    }

    fetcher.submit(formData, { method: 'POST' });
  };

  // Handle block status change - updates database which triggers realtime
  const handleBlockStatusChange = (blockId: string, status: LiveSessionBlockStatus) => {
    const formData = new FormData();
    formData.append('intent', 'update-block-status');
    formData.append('blockId', blockId);
    formData.append('status', status);

    fetcher.submit(formData, { method: 'POST' });
  };

  // Handle block navigation
  const handleBlockChange = (index: number) => {
    setCurrentBlockIndex(index);
    const block = blocks[index];
    if (block) {
      handlePlayStateChange('question_active', block.id);
    }
  };

  return (
    <Modal open>
      <Modal.Content size='full'>
        <Modal.Header
          leadingIcon={
            <div className='flex items-center space-x-2'>
              <div className='flex items-center space-x-1'>
                <div
                  className={cn(
                    'relative flex items-center text-sm font-medium transition-colors',
                    mode === 'live' ? 'text-success' : 'text-muted-foreground',
                  )}
                >
                  <TvMinimalPlay
                    className={cn(mode === 'live' ? 'text-success' : 'text-secondary')}
                  />
                  <span
                    className={cn(
                      'absolute -top-1 -right-1 h-1 w-1 animate-pulse rounded-full',
                      mode === 'live' ? 'bg-success' : 'bg-secondary',
                    )}
                  />
                </div>
                <p
                  className={cn(
                    'font-secondary text-xs',
                    mode === 'live' ? 'text-success' : 'text-secondary',
                  )}
                >
                  {mode}
                </p>
              </div>
              <div className='flex items-center gap-1'>
                {isConnected ? (
                  <Wifi size={14} className='text-success' />
                ) : (
                  <WifiOff size={14} className='text-danger' />
                )}
                <span className='text-muted-foreground text-[10px]'>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          }
          closeRoute={closeRoute}
          title='Session Controls'
        />
        <Modal.Body>
          <div className='space-y-6'>
            {/* Session Info */}
            <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
              <h2 className='text-lg font-semibold'>{session.name}</h2>
              <div className='mt-2 space-y-1 text-sm text-gray-600'>
                <p>
                  <span className='font-medium'>Session Code:</span> {sessionCode}
                </p>
                <p>
                  <span className='font-medium'>Mode:</span>{' '}
                  <span className='capitalize'>{mode}</span>
                </p>
                <p>
                  <span className='font-medium'>Status:</span>{' '}
                  <span className='capitalize'>{session.status}</span>
                </p>
                <p>
                  <span className='font-medium'>Total Blocks:</span> {blocks.length}
                </p>
              </div>
            </div>

            {/* Control Sections */}
            <div className='grid gap-6 lg:grid-cols-2'>
              {/* Session Status Controls */}
              <div className='rounded-lg border border-gray-200 bg-white p-4'>
                <SessionStatusControls
                  currentStatus={currentSessionStatus}
                  onStatusChange={handleSessionStatusChange}
                  disabled={!isConnected}
                />
              </div>

              {/* Block Navigation */}
              <div className='rounded-lg border border-gray-200 bg-white p-4'>
                <BlockControls
                  blocks={blocks}
                  currentBlockIndex={currentBlockIndex}
                  onBlockChange={handleBlockChange}
                  onBlockStatusChange={handleBlockStatusChange}
                  disabled={!isConnected}
                />
              </div>
            </div>

            {/* Play State Controls */}
            <div className='rounded-lg border border-gray-200 bg-white p-4'>
              <PlayStateControls
                currentPlayState={currentPlayState}
                onPlayStateChange={handlePlayStateChange}
                currentBlockId={blocks[currentBlockIndex]?.id}
                disabled={!isConnected}
              />
            </div>

            {/* Blocks List */}
            <div>
              <h3 className='mb-3 text-base font-semibold'>Session Blocks</h3>
              <div className='space-y-2'>
                {blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-3 transition-colors',
                      index === currentBlockIndex
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 bg-white',
                    )}
                  >
                    <div className='flex items-center gap-3'>
                      <span
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                          index === currentBlockIndex
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/10 text-primary',
                        )}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className='font-medium capitalize'>
                          {block.plugin_type.replace(/_/g, ' ')}
                        </p>
                        <p className='text-xs text-gray-500'>
                          Time Limit: {block.time_limit}s | Difficulty: {block.difficulty}
                        </p>
                      </div>
                    </div>
                    <div className='text-sm text-gray-500'>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                          block.status === 'active' && 'bg-success/10 text-success',
                          block.status === 'pending' && 'bg-gray-200 text-gray-700',
                          block.status === 'completed' && 'bg-primary/10 text-primary',
                          block.status === 'skipped' && 'bg-warning/10 text-warning',
                        )}
                      >
                        {block.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

import { useCallback, useEffect } from 'react';
import { data as routerData } from 'react-router';
import { TvMinimalPlay, Wifi, WifiOff } from 'lucide-react';
import { dataWithError, redirectWithError } from 'remix-toast';

import {
  fetchLiveSessionBlocks,
  fetchLiveSessionById,
  updateLiveSessionBlockStatus,
  updateLiveSessionPlayState,
  updateLiveSessionStatus,
} from '@gonasi/database/liveSessions';
import { getUserProfile } from '@gonasi/database/profile';
import type { Database } from '@gonasi/database/schema';

import type { Route } from './+types/live-session-controls-index';
import { useLiveSessionGameState } from './hooks/useLiveSessionGameState';
import { useLiveSessionRealtime } from './hooks/useLiveSessionRealtime';
// Phase-specific panels
import { BlockSkippedPanel } from './panels/BlockSkippedPanel';
import { CountdownPanel } from './panels/CountdownPanel';
import { EndedPanel } from './panels/EndedPanel';
import { FinalResultsPanel } from './panels/FinalResultsPanel';
import { HostSegmentPanel } from './panels/HostSegmentPanel';
import { IntermissionPanel } from './panels/IntermissionPanel';
import { IntroPanel } from './panels/IntroPanel';
import { LeaderboardPanel } from './panels/LeaderboardPanel';
import { LobbyPanel } from './panels/LobbyPanel';
import { NotStartedPanel } from './panels/NotStartedPanel';
import { PausedPanel } from './panels/PausedPanel';
import { PrizesPanel } from './panels/PrizesPanel';
import { QuestionActivePanel } from './panels/QuestionActivePanel';
import { QuestionLockedPanel } from './panels/QuestionLockedPanel';
import { QuestionResultsPanel } from './panels/QuestionResultsPanel';
import { QuestionSoftLockedPanel } from './panels/QuestionSoftLockedPanel';

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

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request);
  const sessionId = params.sessionId ?? '';

  const [session, blocksResult, user] = await Promise.all([
    fetchLiveSessionById({ supabase, sessionId }),
    fetchLiveSessionBlocks({
      supabase,
      liveSessionId: sessionId,
      organizationId: params.organizationId,
    }),
    getUserProfile(supabase),
  ]);

  if (!session) {
    return redirectWithError(`/${params.organizationId}/live-sessions`, 'Session not found.', {
      headers,
    });
  }

  if (!user.user) {
    return redirectWithError(`/${params.organizationId}/live-sessions`, 'User not found.', {
      headers,
    });
  }

  if (!blocksResult.success) {
    return redirectWithError(
      `/${params.organizationId}/live-sessions/${sessionId}/blocks`,
      'Unable to load live session blocks.',
      { headers },
    );
  }

  return routerData(
    {
      session,
      user: user.user,
      blocks: blocksResult.data,
      sessionCode: session.session_code,
      mode: session.mode as 'test' | 'live',
    },
    { headers },
  );
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
        const pauseReason = formData.get('pauseReason') as
          | Database['public']['Enums']['live_session_pause_reason']
          | null;

        const result = await updateLiveSessionStatus({
          supabase,
          sessionId,
          status,
          pauseReason: pauseReason || undefined,
        });

        if (!result.success) {
          return dataWithError(null, result.error, { headers });
        }

        return routerData({ success: true }, { headers });
      }

      case 'update-control-mode': {
        const sessionId = formData.get('sessionId') as string;
        const controlMode = formData.get(
          'controlMode',
        ) as Database['public']['Enums']['live_session_control_mode'];

        const { data, error } = await supabase
          .from('live_sessions')
          .update({ control_mode: controlMode })
          .eq('id', sessionId)
          .select()
          .single();

        if (error) {
          return dataWithError(null, error.message, { headers });
        }

        return routerData({ success: true, data }, { headers });
      }

      case 'update-chat-mode': {
        const sessionId = formData.get('sessionId') as string;
        const chatMode = formData.get(
          'chatMode',
        ) as Database['public']['Enums']['live_session_chat_mode'];

        const { data, error } = await supabase
          .from('live_sessions')
          .update({ chat_mode: chatMode })
          .eq('id', sessionId)
          .select()
          .single();

        if (error) {
          return dataWithError(null, error.message, { headers });
        }

        return routerData({ success: true, data }, { headers });
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

export default function LiveSessionIndex({ params, loaderData }: Route.ComponentProps) {
  const { organizationId, sessionId } = params;
  const { session, blocks, sessionCode, mode, user } = loaderData;

  const closeRoute = `/${organizationId}/live-sessions/${sessionId}/blocks`;

  // Initialize game state hook - manages all session state and actions
  const gameState = useLiveSessionGameState({
    initialSession: session,
    blocks,
    sessionCode,
    mode,
    organizationId,
    sessionId,
    isConnected: true, // Will be updated by realtime hook
  });

  // Handle realtime session updates - sync with server
  const handleSessionUpdate = useCallback(
    (payload: any) => {
      gameState.syncFromServer(payload.new);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Handle realtime block updates
  const handleBlockUpdate = useCallback((payload: any) => {
    console.log('[Live Session] Block updated:', payload);
    // TODO: Update blocks in game state if needed
  }, []);

  // Initialize realtime subscription
  const { isConnected } = useLiveSessionRealtime({
    sessionId,
    mode,
    onSessionUpdate: handleSessionUpdate,
    onBlockUpdate: handleBlockUpdate,
  });

  // Update connection status in game state
  useEffect(() => {
    gameState.setIsConnected(isConnected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  /**
   * PHASE-BASED RENDERING
   * Renders the appropriate panel based on current play state
   */
  const renderPhase = () => {
    const { playState } = gameState.state;

    // Before session starts: play_state is NULL
    if (playState === null) {
      return (
        <NotStartedPanel
          sessionStatus={gameState.state.sessionStatus}
          sessionName={gameState.state.sessionName}
          sessionCode={gameState.state.sessionCode}
          participantCount={0} // TODO: Get from realtime participants
          onStartSession={gameState.startSession}
          disabled={!isConnected || gameState.isLoading}
          user={user}
        />
      );
    }

    // After session starts: render phase-specific panels
    switch (playState) {
      case 'lobby':
        return (
          <LobbyPanel
            state={gameState.state}
            participantCount={0} // TODO: Get from realtime participants
            onBegin={gameState.begin}
            disabled={!isConnected || gameState.isLoading}
          />
        );

      case 'countdown':
        return <CountdownPanel onComplete={() => gameState.setPlayState('intro')} />;

      case 'intro':
        return (
          <IntroPanel
            sessionName={gameState.state.sessionName}
            totalQuestions={gameState.state.blocks.length}
            onNext={gameState.nextQuestion}
            disabled={!isConnected || gameState.isLoading}
          />
        );

      case 'question_active':
        return (
          <QuestionActivePanel
            state={gameState.state}
            onLockNow={gameState.lockQuestion}
            onSkip={gameState.skipBlock}
            onPause={() => gameState.pauseSession('host_hold')}
            disabled={!isConnected || gameState.isLoading}
          />
        );

      case 'question_soft_locked':
        return (
          <QuestionSoftLockedPanel
            onComplete={() => gameState.setPlayState('question_locked')}
            gracePeriodSeconds={3}
          />
        );

      case 'question_locked':
        return (
          <QuestionLockedPanel
            onReveal={gameState.showResults}
            disabled={!isConnected || gameState.isLoading}
          />
        );

      case 'question_results':
        return (
          <QuestionResultsPanel
            state={gameState.state}
            onNext={gameState.showLeaderboard}
            disabled={!isConnected || gameState.isLoading}
          />
        );

      case 'leaderboard':
        return (
          <LeaderboardPanel
            state={gameState.state}
            onNext={() => {
              const hasMoreQuestions =
                gameState.state.currentBlockIndex + 1 < gameState.state.blocks.length;
              if (hasMoreQuestions) {
                gameState.goToIntermission();
              } else {
                gameState.showFinalResults();
              }
            }}
            onShowPrizes={gameState.showPrizes}
            disabled={!isConnected || gameState.isLoading}
          />
        );

      case 'intermission':
        return (
          <IntermissionPanel
            onNext={gameState.nextQuestion}
            nextQuestionNumber={gameState.state.currentBlockIndex + 2}
            isLastQuestion={gameState.state.currentBlockIndex + 1 >= gameState.state.blocks.length}
            disabled={!isConnected || gameState.isLoading}
          />
        );

      case 'paused':
        return (
          <PausedPanel
            reason={gameState.state.pauseReason}
            onResume={gameState.resumeSession}
            disabled={!isConnected || gameState.isLoading}
          />
        );

      case 'host_segment':
        return (
          <HostSegmentPanel
            onEnd={gameState.endHostSegment}
            disabled={!isConnected || gameState.isLoading}
          />
        );

      case 'block_skipped':
        return (
          <BlockSkippedPanel
            blockName={gameState.state.blocks[gameState.state.currentBlockIndex]?.name}
            onComplete={gameState.nextQuestion}
            displaySeconds={2}
          />
        );

      case 'prizes':
        return (
          <PrizesPanel
            onBack={() => gameState.setPlayState('leaderboard')}
            disabled={!isConnected || gameState.isLoading}
          />
        );

      case 'final_results':
        return (
          <FinalResultsPanel
            state={gameState.state}
            onEnd={gameState.endSession}
            disabled={!isConnected || gameState.isLoading}
          />
        );

      case 'ended':
        return (
          <EndedPanel
            sessionName={gameState.state.sessionName}
            totalQuestions={gameState.state.blocks.length}
            onClose={() => (window.location.href = closeRoute)}
            disabled={!isConnected || gameState.isLoading}
          />
        );

      default:
        return (
          <div className='text-muted-foreground flex min-h-[60vh] items-center justify-center'>
            <div className='space-y-4 text-center'>
              <div className='text-4xl'>❓</div>
              <p>Unknown play state: {playState}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <Modal open>
      <Modal.Content size='full'>
        <Modal.Header
          leadingIcon={
            <div className='flex items-center space-x-2'>
              {/* Mode Indicator */}
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
                    'font-secondary flex flex-col text-xs',
                    mode === 'live' ? 'text-success' : 'text-secondary',
                  )}
                >
                  <span>{mode}</span>
                  <span className='text-[8px]'>mode</span>
                </p>
              </div>

              {/* Connection Status */}
              <div className='flex items-center gap-1'>
                {isConnected ? (
                  <Wifi size={14} className='text-success' />
                ) : (
                  <WifiOff size={14} className='text-danger' />
                )}
                <span className='text-muted-foreground font-secondary text-[10px]'>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          }
          closeRoute={closeRoute}
          title={session.name}
          className='container mx-auto'
        />

        <Modal.Body className='px-0 md:px-4'>
          <div className='mx-auto max-w-4xl'>
            {/* PHASE-BASED RENDERING - Main Content */}
            {renderPhase()}

            {/* Debug Info (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <div className='bg-muted/50 mt-8 space-y-2 rounded-lg p-4 font-mono text-xs'>
                <p className='mb-2 text-sm font-bold'>🐛 Debug Info</p>
                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <span className='text-muted-foreground'>Session Status:</span>{' '}
                    <span className='font-semibold'>{gameState.state.sessionStatus}</span>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>Play State:</span>{' '}
                    <span className='font-semibold'>{gameState.state.playState || 'NULL'}</span>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>Block:</span>{' '}
                    <span className='font-semibold'>
                      {gameState.state.currentBlockIndex + 1} / {gameState.state.blocks.length}
                    </span>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>Connected:</span>{' '}
                    <span className='font-semibold'>{isConnected ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>Loading:</span>{' '}
                    <span className='font-semibold'>{gameState.isLoading ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>Control Mode:</span>{' '}
                    <span className='font-semibold'>{gameState.state.controlMode}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

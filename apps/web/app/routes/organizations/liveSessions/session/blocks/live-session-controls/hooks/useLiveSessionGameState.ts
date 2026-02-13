import { useCallback, useMemo, useRef, useState } from 'react';
import { useFetcher } from 'react-router';

import type { Database } from '@gonasi/database/schema';

import type { LiveSessionBlockStatus, LiveSessionPlayState, LiveSessionStatus } from '../types';

/**
 * Session game state integrated with database
 * Manages play state transitions, timers, and phase-based rendering
 */

export interface LiveSessionGameState {
  // Session metadata
  sessionId: string;
  organizationId: string;
  sessionName: string;
  sessionCode: string;
  mode: 'test' | 'live';

  // Current state
  sessionStatus: LiveSessionStatus;
  playState: LiveSessionPlayState | null;
  controlMode: Database['public']['Enums']['live_session_control_mode'];
  chatMode: Database['public']['Enums']['live_session_chat_mode'];
  pauseReason: Database['public']['Enums']['live_session_pause_reason'] | null;

  // Blocks
  blocks: any[]; // TODO: type this properly
  currentBlockIndex: number;
  currentBlockId?: string;

  // Real-time connection
  isConnected: boolean;
}

interface UseLiveSessionGameStateProps {
  initialSession: any;
  blocks: any[];
  sessionCode: string;
  mode: 'test' | 'live';
  organizationId: string;
  sessionId: string;
  isConnected: boolean;
}

export function useLiveSessionGameState({
  initialSession,
  blocks,
  sessionCode,
  mode,
  organizationId,
  sessionId,
  isConnected,
}: UseLiveSessionGameStateProps) {
  const fetcher = useFetcher();

  // Initialize state from server data
  const [state, setState] = useState<LiveSessionGameState>({
    sessionId,
    organizationId,
    sessionName: initialSession.name,
    sessionCode,
    mode,
    sessionStatus: initialSession.status as LiveSessionStatus,
    playState: initialSession.play_state as LiveSessionPlayState | null,
    controlMode:
      (initialSession.control_mode as Database['public']['Enums']['live_session_control_mode']) ||
      'hybrid',
    chatMode:
      (initialSession.chat_mode as Database['public']['Enums']['live_session_chat_mode']) || 'open',
    pauseReason:
      (initialSession.pause_reason as Database['public']['Enums']['live_session_pause_reason']) ||
      null,
    blocks,
    currentBlockIndex: 0,
    currentBlockId: blocks[0]?.id,
    isConnected,
  });

  // Store the play_state before pausing/host_segment so we can restore it
  const previousPlayStateRef = useRef<LiveSessionPlayState | null>(null);

  /**
   * Sync state with server updates (from loader revalidation or realtime)
   */
  const syncFromServer = useCallback((updates: Partial<typeof initialSession>) => {
    setState((s) => ({
      ...s,
      sessionStatus: (updates.status as LiveSessionStatus) || s.sessionStatus,
      playState: (updates.play_state as LiveSessionPlayState | null) ?? s.playState,
      controlMode:
        (updates.control_mode as Database['public']['Enums']['live_session_control_mode']) ||
        s.controlMode,
      chatMode:
        (updates.chat_mode as Database['public']['Enums']['live_session_chat_mode']) || s.chatMode,
      pauseReason:
        updates.pause_reason !== undefined
          ? (updates.pause_reason as
              | Database['public']['Enums']['live_session_pause_reason']
              | null)
          : s.pauseReason,
    }));
  }, []);

  /**
   * Update connection status
   */
  const setIsConnected = useCallback((connected: boolean) => {
    setState((s) => ({ ...s, isConnected: connected }));
  }, []);

  /**
   * Change session status (draft → waiting → active → ended)
   */
  const setSessionStatus = useCallback(
    (
      status: LiveSessionStatus,
      pauseReason?: Database['public']['Enums']['live_session_pause_reason'],
    ) => {
      const formData = new FormData();
      formData.append('intent', 'update-session-status');
      formData.append('sessionId', sessionId);
      formData.append('status', status);
      if (pauseReason) {
        formData.append('pauseReason', pauseReason);
      }

      fetcher.submit(formData, { method: 'POST' });

      // Optimistically update local state
      setState((s) => ({
        ...s,
        sessionStatus: status,
        pauseReason: status === 'paused' ? pauseReason || null : null,
      }));
    },
    [fetcher, sessionId],
  );

  /**
   * Change play state (lobby → countdown → intro → question_active → ...)
   */
  const setPlayState = useCallback(
    (playState: LiveSessionPlayState, blockId?: string) => {
      const formData = new FormData();
      formData.append('intent', 'update-play-state');
      formData.append('sessionId', sessionId);
      formData.append('playState', playState);
      if (blockId) {
        formData.append('currentBlockId', blockId);
      }

      fetcher.submit(formData, { method: 'POST' });

      // Optimistically update local state
      setState((s) => ({
        ...s,
        playState,
        currentBlockId: blockId || s.currentBlockId,
      }));
    },
    [fetcher, sessionId],
  );

  /**
   * Start session (waiting → active or draft → active)
   * Automatically sets play_state to 'lobby' via database trigger
   */
  const startSession = useCallback(() => {
    setSessionStatus('active');
  }, [setSessionStatus]);

  /**
   * Start countdown (lobby → countdown → auto-advances to intro)
   */
  const startCountdown = useCallback(() => {
    setPlayState('countdown');
  }, [setPlayState]);

  /**
   * Go to next question
   */
  const nextQuestion = useCallback(() => {
    setState((s) => {
      const nextIndex = s.currentBlockIndex + 1;
      if (nextIndex >= s.blocks.length) {
        // No more questions, go to final results
        setPlayState('final_results');
        return s;
      }

      const nextBlock = s.blocks[nextIndex];
      setPlayState('question_active', nextBlock.id);

      return {
        ...s,
        currentBlockIndex: nextIndex,
        currentBlockId: nextBlock.id,
      };
    });
  }, [setPlayState]);

  /**
   * Pause session
   */
  const pauseSession = useCallback(
    (reason: Database['public']['Enums']['live_session_pause_reason']) => {
      // Save current play state before pausing
      if (state.playState && state.playState !== 'paused') {
        previousPlayStateRef.current = state.playState;
      }

      setSessionStatus('paused', reason);
      setPlayState('paused');
    },
    [setSessionStatus, setPlayState, state.playState],
  );

  /**
   * Resume from pause
   */
  const resumeSession = useCallback(() => {
    const restored = previousPlayStateRef.current || 'lobby';
    previousPlayStateRef.current = null;

    setSessionStatus('active');
    setPlayState(restored);
  }, [setSessionStatus, setPlayState]);

  /**
   * Start host segment (host talking to crowd)
   */
  const startHostSegment = useCallback(() => {
    // Save current play state
    if (state.playState && state.playState !== 'host_segment') {
      previousPlayStateRef.current = state.playState;
    }

    setPlayState('host_segment');
  }, [setPlayState, state.playState]);

  /**
   * End host segment, restore previous play state
   */
  const endHostSegment = useCallback(() => {
    const restored = previousPlayStateRef.current || 'leaderboard';
    previousPlayStateRef.current = null;

    setPlayState(restored);
  }, [setPlayState]);

  /**
   * Skip current block
   */
  const skipBlock = useCallback(() => {
    setPlayState('block_skipped');

    // Auto-advance after brief display (2 seconds)
    setTimeout(() => {
      setState((s) => {
        const nextIndex = s.currentBlockIndex + 1;
        if (nextIndex >= s.blocks.length) {
          setPlayState('final_results');
          return s;
        }

        const nextBlock = s.blocks[nextIndex];
        setPlayState('question_active', nextBlock.id);

        return {
          ...s,
          currentBlockIndex: nextIndex,
          currentBlockId: nextBlock.id,
        };
      });
    }, 2000);
  }, [setPlayState]);

  /**
   * Update block status
   */
  const setBlockStatus = useCallback(
    (blockId: string, status: LiveSessionBlockStatus) => {
      const formData = new FormData();
      formData.append('intent', 'update-block-status');
      formData.append('blockId', blockId);
      formData.append('status', status);

      fetcher.submit(formData, { method: 'POST' });

      // Optimistically update local state
      setState((s) => ({
        ...s,
        blocks: s.blocks.map((b) => (b.id === blockId ? { ...b, status } : b)),
      }));
    },
    [fetcher],
  );

  /**
   * Change control mode
   */
  const setControlMode = useCallback(
    (controlMode: Database['public']['Enums']['live_session_control_mode']) => {
      const formData = new FormData();
      formData.append('intent', 'update-control-mode');
      formData.append('sessionId', sessionId);
      formData.append('controlMode', controlMode);

      fetcher.submit(formData, { method: 'POST' });

      setState((s) => ({ ...s, controlMode }));
    },
    [fetcher, sessionId],
  );

  /**
   * Change chat mode
   */
  const setChatMode = useCallback(
    (chatMode: Database['public']['Enums']['live_session_chat_mode']) => {
      const formData = new FormData();
      formData.append('intent', 'update-chat-mode');
      formData.append('sessionId', sessionId);
      formData.append('chatMode', chatMode);

      fetcher.submit(formData, { method: 'POST' });

      setState((s) => ({ ...s, chatMode }));
    },
    [fetcher, sessionId],
  );

  /**
   * Go to specific block
   */
  const goToBlock = useCallback(
    (index: number) => {
      const block = blocks[index];
      if (!block) return;

      setState((s) => ({
        ...s,
        currentBlockIndex: index,
        currentBlockId: block.id,
      }));

      setPlayState('question_active', block.id);
    },
    [blocks, setPlayState],
  );

  /**
   * End session
   */
  const endSession = useCallback(() => {
    setPlayState('ended');
    setSessionStatus('ended');
  }, [setPlayState, setSessionStatus]);

  /**
   * Quick transitions (common flows)
   */
  const quickTransitions = useMemo(
    () => ({
      // Start the game from lobby
      begin: () => {
        setPlayState('countdown');
      },

      // Lock question (when time runs out or host forces)
      lockQuestion: () => {
        setPlayState('question_soft_locked');
      },

      // Show results
      showResults: () => {
        setPlayState('question_results');
      },

      // Show leaderboard
      showLeaderboard: () => {
        setPlayState('leaderboard');
      },

      // Go to intermission (before next question)
      goToIntermission: () => {
        setPlayState('intermission');
      },

      // Show prizes
      showPrizes: () => {
        setPlayState('prizes');
      },

      // Show final results
      showFinalResults: () => {
        setPlayState('final_results');
      },
    }),
    [setPlayState],
  );

  return {
    // State
    state,

    // Session lifecycle
    startSession,
    endSession,
    setSessionStatus,

    // Play state management
    playState: state.playState,
    setPlayState,

    // Game flow
    startCountdown,
    nextQuestion,
    skipBlock,

    // Pause/Resume
    pauseSession,
    resumeSession,

    // Host segment
    startHostSegment,
    endHostSegment,

    // Block management
    goToBlock,
    setBlockStatus,

    // Settings
    setControlMode,
    setChatMode,

    // Quick transitions
    ...quickTransitions,

    // Server sync
    syncFromServer,
    setIsConnected,

    // Loading state
    isLoading: fetcher.state !== 'idle',
  };
}

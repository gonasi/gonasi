import type { TypedSupabaseClient } from '../client';
import type { Database } from '../schema';

interface UpdateLiveSessionPlayStateArgs {
  supabase: TypedSupabaseClient;
  sessionId: string;
  playState: Database['public']['Enums']['live_session_play_state'];
  currentBlockId?: string;
}

/**
 * Valid play state transitions
 * Maps current state to allowed next states
 *
 * BUSINESS RULES:
 * - lobby: Can only start countdown or pause before actual start (cannot end before starting)
 * - countdown: Builds anticipation (3...2...1...GO!), leads to intro or first question
 * - Can only reach 'ended' from active gameplay states (not from lobby/countdown)
 * - paused: Can resume to most states except lobby/countdown (can't restart)
 * - ended: Terminal state, no transitions
 */
const VALID_PLAY_STATE_TRANSITIONS: Record<
  Database['public']['Enums']['live_session_play_state'],
  Database['public']['Enums']['live_session_play_state'][]
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

export async function updateLiveSessionPlayState({
  supabase,
  sessionId,
  playState,
  currentBlockId,
}: UpdateLiveSessionPlayStateArgs) {
  // Step 1: Validate session exists and get current state
  const { data: session, error: fetchError } = await supabase
    .from('live_sessions')
    .select('id, status, play_state, organization_id, current_block_id, actual_start_time')
    .eq('id', sessionId)
    .maybeSingle();

  if (fetchError) {
    console.error('[updateLiveSessionPlayState] Fetch error:', fetchError);
    return { success: false as const, error: fetchError.message };
  }

  if (!session) {
    console.error('[updateLiveSessionPlayState] Session not found:', sessionId);
    return {
      success: false as const,
      error: 'Session not found or you do not have permission to edit this session',
    };
  }

  // Step 2: Validate session has started
  // Play state can only be changed after the session has started (actual_start_time is set)
  if (!session.actual_start_time) {
    console.error('[updateLiveSessionPlayState] Session has not started yet:', sessionId);
    return {
      success: false as const,
      error: 'Cannot change play state. Session has not started yet. Please start the session first.',
    };
  }

  // Step 3: Validate business rules based on session status
  if (session.status === 'ended') {
    console.error('[updateLiveSessionPlayState] Cannot update ended session:', sessionId);
    return {
      success: false as const,
      error: 'Cannot modify play state of an ended session',
    };
  }

  // Step 4: Validate play states are appropriate for session status
  const sessionStatus = session.status;

  // When session is in "waiting" status, only lobby, countdown, host_segment, and paused are allowed
  if (sessionStatus === 'waiting') {
    const allowedInWaiting: Database['public']['Enums']['live_session_play_state'][] = [
      'lobby',
      'countdown',
      'host_segment',
      'paused',
    ];
    if (!allowedInWaiting.includes(playState)) {
      return {
        success: false as const,
        error: `Cannot set play state to "${playState}" when session is in "waiting" status. Start the session first.`,
      };
    }
  }

  // When session is in "draft" status, only lobby is allowed
  if (sessionStatus === 'draft') {
    if (playState !== 'lobby') {
      return {
        success: false as const,
        error: `Cannot set play state to "${playState}" when session is in "draft" status. Move to "waiting" first.`,
      };
    }
  }

  // Step 5: Validate play state transition
  const currentPlayState = session.play_state;

  // If currentPlayState is null (shouldn't happen due to trigger, but be safe), treat as if in lobby
  const effectiveCurrentState = currentPlayState || 'lobby';
  const allowedTransitions = VALID_PLAY_STATE_TRANSITIONS[effectiveCurrentState];

  if (!allowedTransitions.includes(playState)) {
    console.error(
      `[updateLiveSessionPlayState] Invalid transition from "${effectiveCurrentState}" to "${playState}"`,
    );
    return {
      success: false as const,
      error: `Cannot transition from "${effectiveCurrentState}" to "${playState}". Invalid play state transition.`,
    };
  }

  // Step 6: Validate current_block_id if transitioning to question_active
  if (playState === 'question_active' && currentBlockId) {
    const { data: block, error: blockError } = await supabase
      .from('live_session_blocks')
      .select('id, status')
      .eq('id', currentBlockId)
      .eq('live_session_id', sessionId)
      .maybeSingle();

    if (blockError || !block) {
      console.error('[updateLiveSessionPlayState] Block not found:', currentBlockId);
      return {
        success: false as const,
        error: 'Invalid block ID or block does not belong to this session',
      };
    }

    // Block should be active or pending to show it
    if (block.status !== 'active' && block.status !== 'pending') {
      return {
        success: false as const,
        error: `Cannot show block with status "${block.status}". Block must be active or pending.`,
      };
    }
  }

  // Step 7: Additional validation for final_results
  if (playState === 'final_results') {
    // Check if all blocks are completed or skipped
    const { data: blocks, error: blocksError } = await supabase
      .from('live_session_blocks')
      .select('id, status')
      .eq('live_session_id', sessionId);

    if (blocksError) {
      console.error('[updateLiveSessionPlayState] Failed to fetch blocks:', blocksError);
      return { success: false as const, error: blocksError.message };
    }

    const hasIncompleteBlocks = blocks?.some(
      (block) => block.status !== 'completed' && block.status !== 'skipped',
    );

    if (hasIncompleteBlocks) {
      return {
        success: false as const,
        error: 'Cannot show final results. Not all blocks have been completed or skipped.',
      };
    }
  }

  // Step 8: Prepare update data
  const updateData: {
    play_state: typeof playState;
    current_block_id?: string | null;
  } = {
    play_state: playState,
  };

  // Only update current_block_id if provided
  if (currentBlockId !== undefined) {
    updateData.current_block_id = currentBlockId || null;
  }

  // Step 9: Attempt update
  const { data, error } = await supabase
    .from('live_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('[updateLiveSessionPlayState] Update error:', error);
    // Provide more specific error messages
    if (error.code === 'PGRST116') {
      return {
        success: false as const,
        error: 'You do not have permission to edit this session',
      };
    }
    return { success: false as const, error: error.message };
  }

  return { success: true as const, data };
}

import type { TypedSupabaseClient } from '../client';
import type { Database } from '../schema';

interface UpdateLiveSessionStatusArgs {
  supabase: TypedSupabaseClient;
  sessionId: string;
  status: Database['public']['Enums']['live_session_status'];
  pauseReason?: Database['public']['Enums']['live_session_pause_reason'];
}

/**
 * Valid session status transitions
 * Maps current status to allowed next statuses
 *
 * Session Lifecycle Flows:
 * 1. Standard: draft → waiting → active → ended
 *    - waiting phase allows participants to join lobby before session starts
 * 2. Quick start: draft → active → ended
 *    - Skips waiting phase for immediate starts or test sessions
 * 3. Can pause at any point during active session
 */
const VALID_SESSION_STATUS_TRANSITIONS: Record<
  Database['public']['Enums']['live_session_status'],
  Database['public']['Enums']['live_session_status'][]
> = {
  draft: ['waiting', 'active', 'ended'], // Can start directly or open lobby first, or cancel
  waiting: ['active', 'paused', 'ended'], // Can start session, pause lobby, or cancel
  active: ['paused', 'ended'],
  paused: ['active', 'ended'],
  ended: [], // Terminal state - no transitions
};

export async function updateLiveSessionStatus({
  supabase,
  sessionId,
  status,
  pauseReason,
}: UpdateLiveSessionStatusArgs) {
  // Step 1: Validate session exists and get current state
  const { data: session, error: fetchError } = await supabase
    .from('live_sessions')
    .select('id, status, organization_id, actual_start_time')
    .eq('id', sessionId)
    .maybeSingle();

  if (fetchError) {
    console.error('[updateLiveSessionStatus] Fetch error:', fetchError);
    return { success: false as const, error: fetchError.message };
  }

  if (!session) {
    console.error('[updateLiveSessionStatus] Session not found:', sessionId);
    return {
      success: false as const,
      error: 'Session not found or you do not have permission to edit this session',
    };
  }

  // Step 2: Validate session is not already ended
  if (session.status === 'ended' && status !== 'ended') {
    console.error('[updateLiveSessionStatus] Cannot update ended session:', sessionId);
    return {
      success: false as const,
      error: 'Cannot modify an ended session. Ended sessions are read-only.',
    };
  }

  // Step 3: Validate status transition
  const currentStatus = session.status;
  const allowedTransitions = VALID_SESSION_STATUS_TRANSITIONS[currentStatus];

  if (!allowedTransitions.includes(status)) {
    console.error(
      `[updateLiveSessionStatus] Invalid transition from "${currentStatus}" to "${status}"`,
    );
    return {
      success: false as const,
      error: `Cannot transition session from "${currentStatus}" to "${status}". Invalid status transition.`,
    };
  }

  // Step 4: Additional validation for specific transitions
  // Validate that session has blocks when transitioning from draft to waiting or active
  if ((status === 'waiting' || status === 'active') && currentStatus === 'draft') {
    // Check if session has at least 1 block
    const { count, error: countError } = await supabase
      .from('live_session_blocks')
      .select('id', { count: 'exact', head: true })
      .eq('live_session_id', sessionId);

    if (countError) {
      console.error('[updateLiveSessionStatus] Failed to count blocks:', countError);
      return { success: false as const, error: countError.message };
    }

    if (!count || count === 0) {
      return {
        success: false as const,
        error: 'Cannot start session. Session must have at least 1 block.',
      };
    }
  }

  // Step 5: Prepare update data
  const updateData: {
    status: typeof status;
    actual_start_time?: string;
    ended_at?: string;
    pause_reason?: Database['public']['Enums']['live_session_pause_reason'] | null;
  } = { status };

  // Set actual_start_time when transitioning to active for the first time
  if (status === 'active' && !session.actual_start_time) {
    updateData.actual_start_time = new Date().toISOString();
  }

  // Set ended_at when ending the session
  if (status === 'ended') {
    updateData.ended_at = new Date().toISOString();
  }

  // Handle pause_reason
  if (status === 'paused') {
    if (!pauseReason) {
      return {
        success: false as const,
        error: 'Pause reason is required when pausing a session',
      };
    }
    updateData.pause_reason = pauseReason;
  } else {
    // Clear pause_reason when not paused
    updateData.pause_reason = null;
  }

  // Step 6: Attempt update
  const { data, error } = await supabase
    .from('live_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('[updateLiveSessionStatus] Update error:', error);
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

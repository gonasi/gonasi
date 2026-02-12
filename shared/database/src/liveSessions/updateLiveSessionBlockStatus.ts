import type { TypedSupabaseClient } from '../client';
import type { Database } from '../schema';

interface UpdateLiveSessionBlockStatusArgs {
  supabase: TypedSupabaseClient;
  blockId: string;
  status: Database['public']['Enums']['live_session_block_status'];
}

/**
 * Valid block status transitions
 * Maps current status to allowed next statuses
 */
const VALID_BLOCK_STATUS_TRANSITIONS: Record<
  Database['public']['Enums']['live_session_block_status'],
  Database['public']['Enums']['live_session_block_status'][]
> = {
  pending: ['active', 'skipped'],
  active: ['closed', 'skipped'], // Can skip if no responses yet
  closed: ['completed'],
  completed: [], // Terminal state
  skipped: [], // Terminal state
};

export async function updateLiveSessionBlockStatus({
  supabase,
  blockId,
  status,
}: UpdateLiveSessionBlockStatusArgs) {
  // Step 1: Validate block exists and get current state
  const { data: block, error: fetchError } = await supabase
    .from('live_session_blocks')
    .select(
      `
      id,
      status,
      live_session_id,
      organization_id,
      live_sessions!inner (
        id,
        status,
        organization_id
      )
    `,
    )
    .eq('id', blockId)
    .maybeSingle();

  if (fetchError) {
    console.error('[updateLiveSessionBlockStatus] Fetch error:', fetchError);
    return { success: false as const, error: fetchError.message };
  }

  if (!block) {
    console.error('[updateLiveSessionBlockStatus] Block not found:', blockId);
    return {
      success: false as const,
      error: 'Block not found or you do not have permission to edit this block',
    };
  }

  // Step 2: Validate session is not ended
  const session = Array.isArray(block.live_sessions)
    ? block.live_sessions[0]
    : block.live_sessions;

  if (session.status === 'ended') {
    console.error('[updateLiveSessionBlockStatus] Cannot update block in ended session:', blockId);
    return {
      success: false as const,
      error: 'Cannot modify block status in an ended session',
    };
  }

  // Step 3: Validate block status transition
  const currentStatus = block.status;
  const allowedTransitions = VALID_BLOCK_STATUS_TRANSITIONS[currentStatus];

  if (!allowedTransitions.includes(status)) {
    console.error(
      `[updateLiveSessionBlockStatus] Invalid transition from "${currentStatus}" to "${status}"`,
    );
    return {
      success: false as const,
      error: `Cannot transition block from "${currentStatus}" to "${status}". Invalid status transition.`,
    };
  }

  // Step 4: Additional validation for specific transitions
  if (status === 'skipped' && currentStatus === 'active') {
    // Check if there are any responses for this block
    const { count, error: countError } = await supabase
      .from('live_session_responses')
      .select('id', { count: 'exact', head: true })
      .eq('live_session_block_id', blockId);

    if (countError) {
      console.error('[updateLiveSessionBlockStatus] Failed to count responses:', countError);
      return { success: false as const, error: countError.message };
    }

    if (count && count > 0) {
      return {
        success: false as const,
        error: `Cannot skip active block with ${count} existing responses. Close it instead.`,
      };
    }
  }

  // Step 5: Prepare update data with timestamps
  const updateData: {
    status: typeof status;
    activated_at?: string;
    closed_at?: string;
  } = { status };

  // Set timestamps based on status
  if (status === 'active') {
    updateData.activated_at = new Date().toISOString();
  } else if (status === 'closed') {
    updateData.closed_at = new Date().toISOString();
  }

  // Step 6: Attempt update
  const { data, error } = await supabase
    .from('live_session_blocks')
    .update(updateData)
    .eq('id', blockId)
    .select()
    .single();

  if (error) {
    console.error('[updateLiveSessionBlockStatus] Update error:', error);
    // Provide more specific error messages
    if (error.code === 'PGRST116') {
      return {
        success: false as const,
        error: 'You do not have permission to edit this block',
      };
    }
    return { success: false as const, error: error.message };
  }

  return { success: true as const, data };
}

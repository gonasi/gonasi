import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

/**
 * Sets a live session to test mode for the current user.
 * This will trigger automatic state reset via the reset_live_session_on_mode_change trigger.
 *
 * @param supabase - A typed Supabase client instance
 * @param sessionId - The ID of the session to switch to test mode
 * @param organizationId - The ID of the organization that owns the session
 * @returns An object indicating success or failure and a message
 */
export async function setLiveSessionToTest({
  supabase,
  sessionId,
  organizationId,
}: {
  supabase: TypedSupabaseClient;
  sessionId: string;
  organizationId: string;
}) {
  // Retrieve the current user's ID
  const userId = await getUserId(supabase);

  // Verify user has permission to edit this session
  const { data: canEdit, error: permissionError } = await supabase.rpc(
    'can_user_edit_live_session',
    {
      arg_session_id: sessionId,
    },
  );

  if (permissionError || !canEdit) {
    console.error('Permission denied to update session mode:', permissionError?.message);
    return {
      success: false,
      message: 'You do not have permission to update this session.',
    };
  }

  // Update the mode to test - the trigger will handle state reset
  const { error } = await supabase
    .from('live_sessions')
    .update({ mode: 'test' })
    .eq('id', sessionId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Failed to set session to test mode:', error.message);
    return {
      success: false,
      message: error.message || 'Unable to switch to test mode.',
    };
  }

  return {
    success: true,
    message: 'Session switched to test mode successfully. All session data has been reset.',
  };
}

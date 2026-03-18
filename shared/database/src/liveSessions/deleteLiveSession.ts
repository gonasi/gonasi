import type { TypedSupabaseClient } from '../client';

interface DeleteLiveSessionArgs {
  supabase: TypedSupabaseClient;
  sessionId: string;
  organizationId: string;
}

/**
 * Deletes a live session
 *
 * Business Rules:
 * - Cannot delete if session is active or paused (live ongoing)
 * - Can only delete sessions in draft, waiting, or ended status
 * - Must have permissions to delete
 *
 * @param supabase - Typed Supabase client
 * @param sessionId - ID of the session to delete
 * @param organizationId - Organization ID for permission check
 * @returns Success/error result with message
 */
export async function deleteLiveSession({
  supabase,
  sessionId,
  organizationId,
}: DeleteLiveSessionArgs) {
  // Fetch current session state
  const { data: session, error: fetchError } = await supabase
    .from('live_sessions')
    .select('id, status, name, organization_id')
    .eq('id', sessionId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (fetchError) {
    console.error('[deleteLiveSession] Fetch error:', fetchError);
    return { success: false as const, message: fetchError.message };
  }

  if (!session) {
    return {
      success: false as const,
      message: 'Session not found or you do not have permission to delete it.',
    };
  }

  // Business Rule: Cannot delete while session is active or paused (ongoing)
  if (session.status === 'active' || session.status === 'paused') {
    return {
      success: false as const,
      message: 'Cannot delete a live session that is currently active or paused. Please end the session first.',
    };
  }

  // Delete the session (cascading deletes will handle related records)
  const { error: deleteError } = await supabase
    .from('live_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('organization_id', organizationId);

  if (deleteError) {
    console.error('[deleteLiveSession] Delete error:', deleteError);
    return { success: false as const, message: deleteError.message };
  }

  return {
    success: true as const,
    message: `Session "${session.name}" deleted successfully.`,
  };
}

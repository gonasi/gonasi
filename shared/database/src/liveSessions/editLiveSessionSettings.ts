import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { Database } from '../schema';

interface EditLiveSessionSettingsArgs {
  supabase: TypedSupabaseClient;
  data: {
    sessionId: string;
    organizationId: string;
    visibility: Database['public']['Enums']['live_session_visibility'];
    sessionKey?: string | null;
    maxParticipants?: number | null;
    allowLateJoin: boolean;
    showLeaderboard: boolean;
    enableChat: boolean;
    enableReactions: boolean;
    timeLimitPerQuestion?: number | null;
  };
}

/**
 * Edits live session settings (visibility, session key, participant settings, etc.)
 *
 * Business Rules:
 * - Cannot edit certain settings while session is active or paused
 * - Session key is required for private visibility
 * - Must have permissions to edit
 *
 * @param supabase - Typed Supabase client
 * @param data - Session settings to update
 * @returns Success/error result with message
 */
export async function editLiveSessionSettings({
  supabase,
  data,
}: EditLiveSessionSettingsArgs) {
  const userId = await getUserId(supabase);

  // Fetch current session state
  const { data: session, error: fetchError } = await supabase
    .from('live_sessions')
    .select('id, status, mode, organization_id')
    .eq('id', data.sessionId)
    .eq('organization_id', data.organizationId)
    .maybeSingle();

  if (fetchError) {
    console.error('[editLiveSessionSettings] Fetch error:', fetchError);
    return { success: false as const, message: fetchError.message };
  }

  if (!session) {
    return {
      success: false as const,
      message: 'Session not found or you do not have permission to edit it.',
    };
  }

  // Business Rule: Cannot edit settings while session is active or paused
  if (session.status === 'active' || session.status === 'paused') {
    return {
      success: false as const,
      message: 'Cannot edit session settings while the session is active or paused.',
    };
  }

  // Business Rule: Private sessions require a session key
  if (data.visibility === 'private' && !data.sessionKey) {
    return {
      success: false as const,
      message: 'Session key is required for private sessions.',
    };
  }

  // Update session settings
  const { error: updateError } = await supabase
    .from('live_sessions')
    .update({
      visibility: data.visibility,
      session_key: data.sessionKey,
      max_participants: data.maxParticipants,
      allow_late_join: data.allowLateJoin,
      show_leaderboard: data.showLeaderboard,
      enable_chat: data.enableChat,
      enable_reactions: data.enableReactions,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.sessionId)
    .eq('organization_id', data.organizationId);

  if (updateError) {
    console.error('[editLiveSessionSettings] Update error:', updateError);
    return { success: false as const, message: updateError.message };
  }

  return {
    success: true as const,
    message: 'Session settings updated successfully.',
  };
}

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

interface EditLiveSessionDetailsArgs {
  supabase: TypedSupabaseClient;
  data: {
    sessionId: string;
    organizationId: string;
    name: string;
    description?: string | null;
    scheduledStartTime?: string | null;
  };
}

/**
 * Edits live session details (name, description, scheduled start time)
 *
 * Business Rules:
 * - Cannot edit while session is active or paused (live ongoing)
 * - Scheduled start time cannot be in the past
 * - Must have permissions to edit
 *
 * @param supabase - Typed Supabase client
 * @param data - Session details to update
 * @returns Success/error result with message
 */
export async function editLiveSessionDetails({
  supabase,
  data,
}: EditLiveSessionDetailsArgs) {
  const userId = await getUserId(supabase);

  // Fetch current session state
  const { data: session, error: fetchError } = await supabase
    .from('live_sessions')
    .select('id, status, mode, organization_id')
    .eq('id', data.sessionId)
    .eq('organization_id', data.organizationId)
    .maybeSingle();

  if (fetchError) {
    console.error('[editLiveSessionDetails] Fetch error:', fetchError);
    return { success: false as const, message: fetchError.message };
  }

  if (!session) {
    return {
      success: false as const,
      message: 'Session not found or you do not have permission to edit it.',
    };
  }

  // Business Rule: Cannot edit details while session is active or paused
  if (session.status === 'active' || session.status === 'paused') {
    return {
      success: false as const,
      message: 'Cannot edit session details while the session is active or paused.',
    };
  }

  // Business Rule: Scheduled start time cannot be in the past
  if (data.scheduledStartTime) {
    const scheduledDate = new Date(data.scheduledStartTime);
    const now = new Date();
    if (scheduledDate < now) {
      return {
        success: false as const,
        message: 'Scheduled start time cannot be in the past.',
      };
    }
  }

  // Update session details
  const { error: updateError } = await supabase
    .from('live_sessions')
    .update({
      name: data.name,
      description: data.description,
      scheduled_start_time: data.scheduledStartTime,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.sessionId)
    .eq('organization_id', data.organizationId);

  if (updateError) {
    console.error('[editLiveSessionDetails] Update error:', updateError);
    return { success: false as const, message: updateError.message };
  }

  return {
    success: true as const,
    message: 'Session details updated successfully.',
  };
}

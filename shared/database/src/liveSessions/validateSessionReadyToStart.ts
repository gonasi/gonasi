import type { TypedSupabaseClient } from '../client';

export interface SessionValidationResult {
  can_start: boolean;
  errors: string[];
}

/**
 * Validates if a live session is ready to start
 * Requirements:
 * - Must have a thumbnail (image_url)
 * - Must have at least one block
 * - Session must not be ended
 *
 * @param supabase - Typed Supabase client
 * @param sessionId - ID of the live session to validate
 * @returns Validation result with can_start boolean and array of error messages
 */
export async function validateSessionReadyToStart(
  supabase: TypedSupabaseClient,
  sessionId: string,
): Promise<SessionValidationResult> {
  const { data, error } = await supabase.rpc('can_start_live_session', {
    arg_session_id: sessionId,
  });

  if (error) {
    throw new Error(`Failed to validate session: ${error.message}`);
  }

  return data as SessionValidationResult;
}

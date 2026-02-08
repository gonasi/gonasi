import type { TypedSupabaseClient } from '../client';

interface FetchLiveSessionByCodeArgs {
  supabase: TypedSupabaseClient;
  sessionCode: string;
}

/**
 * Fetch a live session by its session code (used for joining sessions)
 */
export async function fetchLiveSessionByCode({
  supabase,
  sessionCode,
}: FetchLiveSessionByCodeArgs) {
  try {
    const { data, error } = await supabase
      .from('live_sessions')
      .select(
        `
        id,
        name,
        description,
        session_code,
        organization_id,
        status,
        visibility,
        show_leaderboard,
        enable_chat,
        enable_reactions,
        allow_late_join,
        max_participants,
        scheduled_start_time,
        actual_start_time,
        ended_at,
        image_url,
        blur_hash,
        created_at,
        created_by
      `,
      )
      .eq('session_code', sessionCode)
      .single();

    if (error) {
      console.error('[fetchLiveSessionByCode] error:', error);
      return {
        success: false,
        message: 'Session not found.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Session retrieved successfully.',
      data,
    };
  } catch (err) {
    console.error('Unexpected error in fetchLiveSessionByCode:', err);
    return {
      success: false,
      message: 'Unexpected error occurred while fetching session.',
      data: null,
    };
  }
}

import { getBlurPlaceholderUrl, getSignedUrl } from '@gonasi/cloudinary';

import type { TypedSupabaseClient } from '../client';

interface FetchLiveSessionByIdArgs {
  supabase: TypedSupabaseClient;
  sessionId: string;
}

export async function fetchLiveSessionById({ supabase, sessionId }: FetchLiveSessionByIdArgs) {
  const { data, error } = await supabase
    .from('live_sessions')
    .select(
      `
      id,
      organization_id,
      name,
      description,
      image_url,
      blur_hash,
      session_code,
      session_key,
      visibility,
      status,
      course_id,
      published_course_id,
      max_participants,
      allow_late_join,
      show_leaderboard,
      enable_chat,
      enable_reactions,
      scheduled_start_time,
      actual_start_time,
      ended_at,
      created_at,
      updated_at,
      created_by_profile:profiles!live_sessions_created_by_fkey(
        id,
        username,
        full_name,
        avatar_url
      ),
      courses(id, name)
    `,
    )
    .eq('id', sessionId)
    .single();

  if (error || !data) {
    return null;
  }

  if (!data.image_url) {
    return {
      ...data,
      signedUrl: null,
      blurUrl: null,
    };
  }

  try {
    const version = data.updated_at ? new Date(data.updated_at).getTime() : Date.now();

    const signedUrl = getSignedUrl(data.image_url, {
      width: 800,
      quality: 'auto',
      format: 'auto',
      expiresInSeconds: 3600,
      resourceType: 'image',
      crop: 'fill',
      version,
    });

    const blurUrl = getBlurPlaceholderUrl(data.image_url, 3600);

    return {
      ...data,
      signedUrl,
      blurUrl,
    };
  } catch {
    console.error('[fetchLiveSessionById] Failed to generate signed URL');
    return {
      ...data,
      signedUrl: null,
      blurUrl: null,
    };
  }
}

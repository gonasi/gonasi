import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

interface UpsertLiveSessionBlockPayload {
  id?: string;
  live_session_id: string;
  organization_id: string;
  plugin_type: string;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  weight: number;
  time_limit: number | null;
}

interface UpsertLiveSessionBlockArgs {
  supabase: TypedSupabaseClient;
  payload: UpsertLiveSessionBlockPayload;
}

export async function upsertLiveSessionBlock({ supabase, payload }: UpsertLiveSessionBlockArgs): Promise<ApiResponse> {
  const userId = await getUserId(supabase);
  const isCreate = !payload.id;

  try {
    const upsertData: Record<string, unknown> = {
      organization_id: payload.organization_id,
      live_session_id: payload.live_session_id,
      plugin_type: payload.plugin_type,
      content: payload.content,
      settings: payload.settings,
      weight: payload.weight,
      time_limit: payload.time_limit,
    };

    if (isCreate) {
      // Compute next position
      const { data: maxRow } = await supabase
        .from('live_session_blocks')
        .select('position')
        .eq('live_session_id', payload.live_session_id)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const nextPosition = (maxRow?.position ?? 0) + 1;
      upsertData.position = nextPosition;
      upsertData.created_by = userId;
    } else {
      upsertData.id = payload.id;
      upsertData.updated_by = userId;
    }

    const { error } = await supabase.from('live_session_blocks').upsert(upsertData as any);

    if (error) {
      console.error('[upsertLiveSessionBlock] error:', error);
      return { success: false, message: 'Failed to save the block. Please try again.' };
    }

    return {
      success: true,
      message: isCreate ? 'Block created successfully.' : 'Block updated successfully.',
    };
  } catch (err) {
    console.error('[upsertLiveSessionBlock] unexpected error:', err);
    return { success: false, message: 'Something went wrong — try again in a bit.' };
  }
}

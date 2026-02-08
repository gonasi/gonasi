import type { LiveSessionBuilderSchemaTypes } from '@gonasi/schemas/liveSessions';

import type { TypedSupabaseClient } from '../client';

interface FetchLiveSessionBlocksArgs {
  supabase: TypedSupabaseClient;
  liveSessionId: string;
  organizationId: string;
}

// Extend the validated block with database fields
export type LiveSessionBlock = LiveSessionBuilderSchemaTypes & {
  id: string;
  position: number;
  status: string;
};

interface FetchLiveSessionBlocksSuccess {
  success: true;
  message: string;
  data: LiveSessionBlock[];
}

interface FetchLiveSessionBlocksError {
  success: false;
  message: string;
  data: [];
}

type FetchLiveSessionBlocksResult = FetchLiveSessionBlocksSuccess | FetchLiveSessionBlocksError;

export async function fetchLiveSessionBlocks({
  supabase,
  liveSessionId,
  organizationId,
}: FetchLiveSessionBlocksArgs): Promise<FetchLiveSessionBlocksResult> {
  try {
    const { data, error } = await supabase
      .from('live_session_blocks')
      .select('id, plugin_type, content, settings, position, time_limit, status, difficulty')
      .eq('live_session_id', liveSessionId)
      .eq('organization_id', organizationId)
      .order('position', { ascending: true });

    if (error) {
      console.error('[fetchLiveSessionBlocks] error:', error);
      return {
        success: false,
        message: 'Failed to load live session blocks.',
        data: [],
      };
    }

    // Just cast - trust your database has valid data
    const blocks = (data ?? []) as LiveSessionBlock[];

    if (blocks.length === 0) {
      return {
        success: true,
        message: 'No blocks found.',
        data: [],
      };
    }

    return {
      success: true,
      message: 'Live session blocks retrieved successfully.',
      data: blocks,
    };
  } catch (err) {
    console.error('Unexpected error in fetchLiveSessionBlocks:', err);
    return {
      success: false,
      message: 'Unexpected error occurred while loading live session blocks.',
      data: [],
    };
  }
}

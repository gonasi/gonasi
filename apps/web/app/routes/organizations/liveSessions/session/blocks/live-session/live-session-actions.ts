import { data as routerData } from 'react-router';
import { dataWithError } from 'remix-toast';

import {
  updateLiveSessionBlockStatus,
  updateLiveSessionPlayState,
  updateLiveSessionStatus,
} from '@gonasi/database/liveSessions';
import type { Database } from '@gonasi/database/schema';

import type { Route } from './+types/live-session-index';

import { createClient } from '~/lib/supabase/supabase.server';

export async function action({ request }: Route.ActionArgs) {
  const { supabase, headers } = createClient(request);
  const formData = await request.formData();

  const intent = formData.get('intent') as string;

  try {
    switch (intent) {
      case 'update-session-status': {
        const sessionId = formData.get('sessionId') as string;
        const status = formData.get('status') as Database['public']['Enums']['live_session_status'];

        const result = await updateLiveSessionStatus({
          supabase,
          sessionId,
          status,
        });

        if (!result.success) {
          return dataWithError(null, result.error, { headers });
        }

        return routerData({ success: true }, { headers });
      }

      case 'update-play-state': {
        const sessionId = formData.get('sessionId') as string;
        const playState = formData.get(
          'playState',
        ) as Database['public']['Enums']['live_session_play_state'];
        const currentBlockId = formData.get('currentBlockId') as string | undefined;

        const result = await updateLiveSessionPlayState({
          supabase,
          sessionId,
          playState,
          currentBlockId: currentBlockId || undefined,
        });

        if (!result.success) {
          return dataWithError(null, result.error, { headers });
        }

        return routerData({ success: true }, { headers });
      }

      case 'update-block-status': {
        const blockId = formData.get('blockId') as string;
        const blockStatus = formData.get(
          'status',
        ) as Database['public']['Enums']['live_session_block_status'];

        const result = await updateLiveSessionBlockStatus({
          supabase,
          blockId,
          status: blockStatus,
        });

        if (!result.success) {
          return dataWithError(null, result.error, { headers });
        }

        return routerData({ success: true }, { headers });
      }

      default:
        return dataWithError(null, 'Invalid intent', { headers });
    }
  } catch (error) {
    console.error('[Live Session Actions] Error:', error);
    return dataWithError(null, 'An unexpected error occurred', { headers });
  }
}

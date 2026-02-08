import { redirectWithError } from 'remix-toast';

import { fetchLiveSessionBlocks, fetchLiveSessionByCode } from '@gonasi/database/liveSessions';
import { getUserId } from '@gonasi/database/utils';

import type { Route } from './+types/session-test';

import { LiveSessionPlayEngine } from '~/components/liveSession/LiveSessionPlayEngine';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [
    { title: 'Test Session • Gonasi' },
    {
      name: 'description',
      content: 'Test your live session before going live.',
    },
  ];
}

/**
 * Loader - Fetch session and blocks for test mode
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const sessionCode = params.sessionCode;

  // Fetch session by code
  const sessionResult = await fetchLiveSessionByCode({ supabase, sessionCode });

  if (!sessionResult.success || !sessionResult.data) {
    return redirectWithError('/go/explore', 'Session not found.');
  }

  const session = sessionResult.data;

  // Check privacy/visibility (same as live mode)
  if (session.visibility === 'private') {
    // TODO: Verify user is invited participant or facilitator
    const userId = await getUserId(supabase);
    if (!userId) {
      return redirectWithError(`/live/${sessionCode}/join`, 'Please sign in to test this session.');
    }
  }

  // Test mode allows testing any session status (even drafts)
  // This is useful for facilitators to test before publishing

  // Fetch blocks
  const blocksResult = await fetchLiveSessionBlocks({
    supabase,
    liveSessionId: session.id,
    organizationId: session.organization_id,
  });

  if (!blocksResult.success) {
    return redirectWithError('/go/explore', 'Unable to load session blocks.');
  }

  // Test mode: No participant record created

  return {
    sessionCode,
    sessionId: session.id,
    blocks: blocksResult.data,
    sessionTitle: `${session.name} (Test Mode)`,
    session: {
      status: session.status,
      showLeaderboard: session.show_leaderboard,
      enableChat: session.enable_chat,
      enableReactions: session.enable_reactions,
      allowLateJoin: session.allow_late_join,
    },
  };
}

/**
 * Action - Handle test mode interactions
 * Test mode doesn't write to database
 */
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  switch (intent) {
    case 'submit_response':
      // Test mode: Just acknowledge, don't persist
      console.log('[Test Mode] Response received but not saved');
      return { success: true, mode: 'test' };

    default:
      return { success: false, message: 'Unknown action' };
  }
}

/**
 * SessionTest - Test mode component
 * Uses LiveSessionPlayEngine with mode="test"
 *
 * Key differences from live mode:
 * - No database writes
 * - Ephemeral Realtime channel
 * - Manual navigation controls
 * - Clear "Test Mode" indicators
 * - Multi-user testing supported (respects privacy)
 */
export default function SessionTest({ loaderData }: Route.ComponentProps) {
  return (
    <LiveSessionPlayEngine
      mode='test'
      sessionCode={loaderData.sessionCode}
      sessionId={loaderData.sessionId}
      blocks={loaderData.blocks}
      sessionTitle={loaderData.sessionTitle}
    />
  );
}

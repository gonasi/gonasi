import { Outlet } from 'react-router';
import { TvMinimalPlay } from 'lucide-react';
import { redirectWithError } from 'remix-toast';

import { fetchLiveSessionBlocks, fetchLiveSessionById } from '@gonasi/database/liveSessions';

import type { Route } from './+types/control-panel';
import { ModeToggle } from './components/ModeToggle';

import { Button } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';

// TODO: Implement metadata
export function meta() {
  return [
    { title: 'Control Panel • Gonasi' },
    {
      name: 'description',
      content: 'Control your live session in real-time.',
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const sessionId = params.sessionId ?? '';

  const [session, blocks, canEditResult] = await Promise.all([
    fetchLiveSessionById({ supabase, sessionId }),
    fetchLiveSessionBlocks({
      supabase,
      liveSessionId: sessionId,
      organizationId: params.organizationId,
    }),
    supabase.rpc('can_user_edit_live_session', { arg_session_id: sessionId }),
  ]);

  if (!blocks.success) {
    return redirectWithError(
      `/${params.organizationId}/live-sessions/${sessionId}/blocks`,
      'Unable to load live session blocks.',
    );
  }

  if (!session) {
    return redirectWithError(`/${params.organizationId}/live-sessions`, 'Session not found.');
  }

  return {
    session,
    blocks: blocks.data,
    canEdit: canEditResult.data ?? false,
    sessionCode: session.session_code,
  };
}

// TODO: Implement action for session controls
export async function action({ request, params: _params }: Route.ActionArgs) {
  const { supabase: _supabase } = createClient(request);
  const _formData = await request.formData();

  // TODO: Handle different actions:
  // - start_session (draft → waiting)
  // - pause_session
  // - resume_session
  // - end_session
  // - activate_block (pending → active)
  // - close_block (active → closed)
  // - skip_block (pending → skipped)

  return { success: true };
}

// TODO: Implement control panel component with real-time updates
export default function ControlPanel({ params: _params, loaderData }: Route.ComponentProps) {
  const { session } = loaderData;

  // TODO: Set up Supabase Realtime subscriptions:
  // - live_session_participants (for participant changes)
  // - live_session_responses (for response submissions)
  // - live_session_blocks (for block status updates)

  // TODO: Session Controls:
  // - Start session button (draft → waiting)
  // - Pause/Resume buttons
  // - End session button

  // TODO: Block Management:
  // - List blocks with position
  // - "Activate" button (pending → active)
  // - "Close" button (active → closed)
  // - "Skip" button (pending → skipped)
  // - Current active block highlighted

  // TODO: Live Stats Dashboard:
  // - Participant count (with join/leave activity feed)
  // - Current block response rate (real-time progress bar)
  // - Current block accuracy %
  // - Average response time

  // TODO: Leaderboard (real-time):
  // - Top 10 participants
  // - Score, rank, avg speed
  // - Auto-updates via Supabase Realtime

  // TODO: Optional Features (if enabled):
  // - Chat feed (read-only or moderation)
  // - Reactions display (emoji stream)

  return (
    <>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>Control Panel</h2>
          <div className='flex items-end justify-center gap-2'>
            <ModeToggle mode={session.mode} />
            <div className='flex gap-2'>
              <Button variant='success' leftIcon={<TvMinimalPlay />}>
                Start Session
              </Button>
            </div>
          </div>
        </div>

        <div className='grid gap-6 md:grid-cols-2'>
          {/* TODO: Blocks control section */}
          <div className='rounded border p-4'>
            <h3 className='mb-4 font-semibold'>Blocks</h3>
            <p>Block controls go here...</p>
          </div>

          {/* TODO: Live stats section */}
          <div className='rounded border p-4'>
            <h3 className='mb-4 font-semibold'>Live Stats</h3>
            <p>Stats dashboard goes here...</p>
          </div>
        </div>

        {/* TODO: Leaderboard section */}
        <div className='rounded border p-4'>
          <h3 className='mb-4 font-semibold'>Leaderboard</h3>
          <p>Real-time leaderboard goes here...</p>
        </div>
      </div>
      <Outlet context={{ mode: session.mode }} />
    </>
  );
}

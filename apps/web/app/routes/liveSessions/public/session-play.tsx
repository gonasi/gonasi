import type { Route } from './+types/session-play';

import { createClient } from '~/lib/supabase/supabase.server';

// TODO: Implement metadata
export function meta() {
  return [
    { title: 'Live Session • Gonasi' },
    {
      name: 'description',
      content: 'Participate in a live interactive session on Gonasi.',
    },
  ];
}

// TODO: Implement loader to fetch session and current block
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const sessionCode = params.sessionCode;

  // TODO: Fetch session by code
  // TODO: Verify user is participant
  // TODO: Fetch current active block
  // TODO: Fetch participant stats for leaderboard
  // TODO: Check if leaderboard, chat, reactions are enabled

  return { sessionCode };
}

// TODO: Implement action for submitting responses
export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createClient(request);
  const formData = await request.formData();

  // TODO: Validate response data
  // TODO: Submit to live_session_responses
  // TODO: Trigger stats update
  // TODO: Return success with feedback

  return { success: true };
}

// TODO: Implement session play component with real-time updates
export default function SessionPlay({ loaderData }: Route.ComponentProps) {
  // TODO: Set up Supabase Realtime subscriptions:
  // - live_session_blocks (for new questions)
  // - live_session_participants (for leaderboard updates)
  // - live_sessions (for status changes)

  // TODO: Waiting State (session not started):
  // - "Waiting for host" message
  // - Countdown to scheduled start (if set)

  // TODO: Active State:
  // - Current question display (uses existing plugin viewers)
  // - Answer input (uses existing plugin UI)
  // - Submit button
  // - Timer countdown (if block has time limit)
  // - "Your response has been recorded" confirmation
  // - Block transition animations

  // TODO: Leaderboard (if enabled):
  // - Shows current rank
  // - Top 10 with scores
  // - Updates in real-time

  // TODO: Optional Features:
  // - Chat (if enabled)
  // - Reactions (if enabled)

  // TODO: End State:
  // - Final leaderboard
  // - Your stats summary
  // - "Session Ended" message

  return (
    <div className='mx-auto max-w-4xl p-4'>
      <h1 className='text-2xl font-bold'>Live Session</h1>
      <p className='text-muted-foreground'>Session Code: {loaderData.sessionCode}</p>

      {/* TODO: Implement session play UI */}
      <div className='mt-8'>
        <p>Session play interface goes here...</p>
      </div>
    </div>
  );
}

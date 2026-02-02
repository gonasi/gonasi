import { Form } from 'react-router';

import type { Route } from './+types/join-session';

import { createClient } from '~/lib/supabase/supabase.server';

// TODO: Implement metadata
export function meta() {
  return [
    { title: 'Join Live Session • Gonasi' },
    {
      name: 'description',
      content: 'Join a live interactive session on Gonasi.',
    },
  ];
}

// TODO: Implement loader to fetch session details
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const sessionCode = params.sessionCode;

  // TODO: Fetch session by code
  // TODO: Check session status (draft/waiting/active/ended)
  // TODO: Check visibility and key requirements
  // TODO: Check if user is already a participant

  return { sessionCode };
}

// TODO: Implement action to join session
export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createClient(request);
  const formData = await request.formData();

  // TODO: Validate session key for private sessions
  // TODO: Check max participants limit
  // TODO: Check user is org member
  // TODO: Call join_live_session() RPC
  // TODO: Redirect to /live/:sessionCode

  return { success: true };
}

// TODO: Implement join session component
export default function JoinSession({ loaderData }: Route.ComponentProps) {
  // TODO: Display session info (name, description, instructor)
  // TODO: Show session status
  // TODO: For private sessions: password/key input field
  // TODO: "Join Session" button
  // TODO: Handle validation errors
  // TODO: Optional display name input for leaderboard

  return (
    <div className='mx-auto max-w-2xl p-4'>
      <h1 className='text-2xl font-bold'>Join Live Session</h1>
      <p className='text-muted-foreground'>Session Code: {loaderData.sessionCode}</p>

      <Form method='POST' className='mt-8 space-y-4'>
        {/* TODO: Implement join form */}
        <button type='submit' className='rounded bg-blue-500 px-4 py-2 text-white'>
          Join Session
        </button>
      </Form>
    </div>
  );
}

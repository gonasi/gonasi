import { NavLink, Outlet } from 'react-router';

import type { Route } from './+types/session-index';

import { createClient } from '~/lib/supabase/supabase.server';

// TODO: Implement metadata
export function meta({ data }: Route.MetaArgs) {
  return [
    { title: `${data?.session?.name ?? 'Session'} • Gonasi` },
    {
      name: 'description',
      content: 'Manage your live session on Gonasi.',
    },
  ];
}

// TODO: Implement loader to fetch session details
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // TODO: Fetch session by ID
  // TODO: Check user can edit session (can_user_edit_live_session)
  // TODO: Fetch quick stats (participants count, blocks count, responses count)

  return { session: null };
}

// TODO: Implement session dashboard component
export default function SessionIndex({ params, loaderData }: Route.ComponentProps) {
  const { session } = loaderData;

  // TODO: Tabs navigation: Overview, Blocks, Facilitators, Control, Analytics
  // TODO: Status badge (draft, waiting, active, paused, ended)
  // TODO: Quick stats display (participants, blocks, responses)
  // TODO: Session code display (with copy button)
  // TODO: Start/Stop session buttons

  return (
    <div className='mx-auto max-w-7xl p-4'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>{session?.name ?? 'Session Dashboard'}</h1>
        <p className='text-muted-foreground'>Session Code: {params.sessionId}</p>
      </div>

      {/* TODO: Implement tabs navigation */}
      <nav className='mb-6 flex gap-4 border-b'>
        <NavLink
          to={`/${params.organizationId}/live-sessions/${params.sessionId}/overview`}
          className='px-4 py-2'
        >
          Overview
        </NavLink>
        <NavLink to={`/${params.organizationId}/live-sessions/${params.sessionId}/blocks`} className='px-4 py-2'>
          Blocks
        </NavLink>
        <NavLink
          to={`/${params.organizationId}/live-sessions/${params.sessionId}/facilitators`}
          className='px-4 py-2'
        >
          Facilitators
        </NavLink>
        <NavLink to={`/${params.organizationId}/live-sessions/${params.sessionId}/control`} className='px-4 py-2'>
          Control
        </NavLink>
        <NavLink to={`/${params.organizationId}/live-sessions/${params.sessionId}/analytics`} className='px-4 py-2'>
          Analytics
        </NavLink>
      </nav>

      <Outlet />
    </div>
  );
}

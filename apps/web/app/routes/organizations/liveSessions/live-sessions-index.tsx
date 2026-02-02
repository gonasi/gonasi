import { NavLink, Outlet } from 'react-router';
import { Plus } from 'lucide-react';

import type { Route } from './+types/live-sessions-index';

import { NotFoundCard } from '~/components/cards';
import { IconNavLink } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';

// TODO: Implement metadata
export function meta() {
  return [
    { title: 'Live Sessions • Gonasi' },
    {
      name: 'description',
      content: 'Manage and view all live sessions created by your organization on Gonasi.',
    },
  ];
}

// TODO: Implement loader to fetch sessions
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // TODO: Fetch organization live sessions
  // TODO: Apply search filter (name)
  // TODO: Apply status filter (draft, active, ended)
  // TODO: Pagination support
  // TODO: Check user's org role for permissions

  return { sessions: [] };
}

// TODO: Implement sessions list component
export default function LiveSessionsIndex({ params, loaderData }: Route.ComponentProps) {
  const { sessions } = loaderData;

  // TODO: Card grid displaying sessions (draft, active, ended)
  // TODO: Filter by status
  // TODO: Search by name
  // TODO: Visibility indicators (public/unlisted/private)
  // TODO: "New Session" button
  // TODO: Shows facilitators (avatars)
  // TODO: Quick actions (edit, control, analytics)

  return (
    <>
      <div className='mx-auto pt-4'>
        <div className='flex items-center justify-between px-4'>
          <h2 className='text-lg md:text-2xl'>Live Sessions</h2>
          <IconNavLink
            to={`/${params.organizationId}/live-sessions/new`}
            icon={Plus}
            className='rounded-lg border p-2'
          />
        </div>

        <section className='px-0 py-4 md:px-4'>
          {sessions && sessions.length ? (
            <div className='grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-4 lg:grid-cols-3'>
              {/* TODO: Map sessions to cards */}
              <p>Session cards go here...</p>
            </div>
          ) : (
            <div className='max-w-md'>
              <NotFoundCard message='No live sessions found. Create one to get started.' />
            </div>
          )}
        </section>
      </div>

      <Outlet />
    </>
  );
}

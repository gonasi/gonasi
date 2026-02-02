import { NavLink, Outlet } from 'react-router';
import { Edit, Settings, Trash2 } from 'lucide-react';

import type { Route } from './+types/overview-index';

import { IconNavLink } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';

// TODO: Implement metadata
export function meta() {
  return [
    { title: 'Session Overview • Gonasi' },
    {
      name: 'description',
      content: 'View and edit session metadata.',
    },
  ];
}

// TODO: Implement loader to fetch session details
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // TODO: Fetch session by ID
  // TODO: Check user can edit session

  return { session: null };
}

// TODO: Implement overview component
export default function OverviewIndex({ params, loaderData }: Route.ComponentProps) {
  const { session } = loaderData;

  // TODO: Display session details (name, description, code, key)
  // TODO: Visibility settings display
  // TODO: Configuration display (max participants, late join, leaderboard, chat, reactions)
  // TODO: Time limits display
  // TODO: Course integration (optional link to course/published_course)
  // TODO: Actions: Edit Details, Edit Settings, Delete

  return (
    <>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>Session Overview</h2>
          <div className='flex gap-2'>
            <IconNavLink
              to={`/${params.organizationId}/live-sessions/${params.sessionId}/overview/edit-details`}
              icon={Edit}
              className='rounded border p-2'
            />
            <IconNavLink
              to={`/${params.organizationId}/live-sessions/${params.sessionId}/overview/edit-settings`}
              icon={Settings}
              className='rounded border p-2'
            />
            <IconNavLink
              to={`/${params.organizationId}/live-sessions/${params.sessionId}/overview/delete`}
              icon={Trash2}
              className='rounded border p-2 text-red-500'
            />
          </div>
        </div>

        {/* TODO: Display session information */}
        <div className='rounded border p-4'>
          <p>Session details go here...</p>
        </div>
      </div>

      <Outlet />
    </>
  );
}

import { Outlet } from 'react-router';
import { UserPlus } from 'lucide-react';

import type { Route } from './+types/facilitators-index';

import { IconNavLink } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';

// TODO: Implement metadata
export function meta() {
  return [
    { title: 'Session Facilitators • Gonasi' },
    {
      name: 'description',
      content: 'Manage assigned facilitators for your live session.',
    },
  ];
}

// TODO: Implement loader to fetch facilitators
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // TODO: Fetch session facilitators
  // TODO: Check user's org role (admins/owners can add/remove, editors can only view)

  return { facilitators: [], userRole: null };
}

// TODO: Implement facilitators management component
export default function FacilitatorsIndex({ params, loaderData }: Route.ComponentProps) {
  const { facilitators, userRole } = loaderData;

  // TODO: List current facilitators (with avatars, usernames)
  // TODO: "Add Facilitator" button (admins/owners only)
  // TODO: Remove facilitator button (admins/owners only)
  // TODO: Shows who added each facilitator + when

  const canManageFacilitators = userRole === 'owner' || userRole === 'admin';

  return (
    <>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>Facilitators</h2>
          {canManageFacilitators && (
            <IconNavLink
              to={`/${params.organizationId}/live-sessions/${params.sessionId}/facilitators/add`}
              icon={UserPlus}
              className='rounded-lg border p-2'
            />
          )}
        </div>

        {facilitators && facilitators.length ? (
          <div className='space-y-4'>
            {/* TODO: Map facilitators to cards */}
            <p>Facilitator cards go here...</p>
          </div>
        ) : (
          <div className='rounded border p-8 text-center'>
            <p className='text-muted-foreground'>No facilitators assigned yet.</p>
          </div>
        )}
      </div>

      <Outlet />
    </>
  );
}

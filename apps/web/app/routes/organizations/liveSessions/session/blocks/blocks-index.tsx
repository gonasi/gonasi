import { Outlet } from 'react-router';
import { Plus } from 'lucide-react';

import type { Route } from './+types/blocks-index';

import { IconNavLink } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';

// TODO: Implement metadata
export function meta() {
  return [
    { title: 'Session Blocks • Gonasi' },
    {
      name: 'description',
      content: 'Manage question blocks for your live session.',
    },
  ];
}

// TODO: Implement loader to fetch blocks
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // TODO: Fetch session blocks ordered by position
  // TODO: Check user can edit session
  // TODO: If session is active, fetch real-time stats (response count, accuracy, avg time)

  return { blocks: [] };
}

// TODO: Implement blocks management component
export default function BlocksIndex({ params, loaderData }: Route.ComponentProps) {
  const { blocks } = loaderData;

  // TODO: List all blocks with preview
  // TODO: Drag-and-drop reordering (like lesson blocks)
  // TODO: Block status indicators (pending, active, closed, skipped)
  // TODO: "Add Block" button → Opens plugin selector
  // TODO: Click block → Edit
  // TODO: Real-time stats (if session is active): response count, accuracy, avg time

  return (
    <>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>Question Blocks</h2>
          <IconNavLink
            to={`/${params.organizationId}/live-sessions/${params.sessionId}/blocks/new`}
            icon={Plus}
            className='rounded-lg border p-2'
          />
        </div>

        {blocks && blocks.length ? (
          <div className='space-y-4'>
            {/* TODO: Map blocks to draggable cards */}
            <p>Block cards go here...</p>
          </div>
        ) : (
          <div className='rounded border p-8 text-center'>
            <p className='text-muted-foreground'>No blocks yet. Add your first question block to get started.</p>
          </div>
        )}
      </div>

      <Outlet />
    </>
  );
}

import { data, Outlet } from 'react-router';
import { dataWithError, dataWithSuccess } from 'remix-toast';

import {
  fetchAllStaffInvitesByCompanyId,
  resendStaffInvitation,
} from '@gonasi/database/staffInvites';

import type { Route } from './+types/staff-invites';

import { InviteCard } from '~/components/cards/invite-card';
import { ViewLayout } from '~/components/layouts/view';
import { SearchInput } from '~/components/search-params/search-input';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export type StaffInvitesLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data'];

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const url = new URL(request.url);
  const searchQuery = url.searchParams.get('name') ?? '';
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = 12;

  const staffInvites = await fetchAllStaffInvitesByCompanyId({
    supabase,
    searchQuery,
    limit,
    page,
    companyId: params.companyId,
  });

  return data(staffInvites);
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  const inviteId = formData.get('inviteId') as string | null;

  if (!inviteId) {
    return dataWithError(null, 'Missing inviteId');
  }

  const { supabase } = createClient(request);

  const { success, message } = await resendStaffInvitation(supabase, inviteId, params.companyId);

  return success ? dataWithSuccess({ success: true }, message) : dataWithError(null, message);
}

export default function StaffInvites({ loaderData, params }: Route.ComponentProps) {
  return (
    <>
      <ViewLayout
        newLink={`/dashboard/${params.companyId}/team-management/staff-invites/new`}
        newText='Invite'
      >
        <div className='pb-4'>
          <SearchInput placeholder='Search invites...' />
        </div>
        <InviteCard loaderData={loaderData} />
      </ViewLayout>
      <Outlet />
    </>
  );
}

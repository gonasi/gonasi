import { data, Outlet, useOutletContext } from 'react-router';

import { fetchAllUserStaffMembers } from '@gonasi/database/staffMembers';

import type { Route } from './+types/staff-directory';

import { UsersCard } from '~/components/cards/users-card';
import { SearchInput } from '~/components/search-params/search-input';
import { createClient } from '~/lib/supabase/supabase.server';
import type { AppOutletContext } from '~/root';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export type StaffMembersLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data'];

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const url = new URL(request.url);
  const searchQuery = url.searchParams.get('name') ?? '';
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = 12;

  const staffMembers = await fetchAllUserStaffMembers({
    supabase,
    searchQuery,
    limit,
    page,
    companyId: params.companyId,
  });

  return data(staffMembers);
}

export default function StaffDirectory({ loaderData, params }: Route.ComponentProps) {
  const { user, role, activeCompany } = useOutletContext<AppOutletContext>();

  return (
    <>
      <div>
        <div className='pb-4'>
          <SearchInput placeholder='Search staff members...' />
        </div>
        <UsersCard loaderData={loaderData} user={user} companyId={params.companyId} />
      </div>
      <Outlet context={{ user, role, activeCompany }} />
    </>
  );
}

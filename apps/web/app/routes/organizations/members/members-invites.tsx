import { Outlet, useOutletContext } from 'react-router';
import { Plus } from 'lucide-react';

import type { Route } from './+types/members-invites';

import { IconNavLink } from '~/components/ui/button';
import type { OrganizationsOutletContextType } from '~/routes/layouts/organizations/organizations-layout';

export default function MembersInvites({ params }: Route.ComponentProps) {
  const { data } = useOutletContext<OrganizationsOutletContextType>();

  return (
    <>
      <div className='flex items-center justify-between px-4'>
        <h2 className='text-2xl'>Member Invites</h2>
        <IconNavLink
          to={`/${params.organizationId}/members/invites/new-invite`}
          icon={Plus}
          className='rounded-lg border p-2'
        />
      </div>
      <Outlet context={{ data }} />
    </>
  );
}

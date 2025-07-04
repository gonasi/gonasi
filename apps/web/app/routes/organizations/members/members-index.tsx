import { Outlet, useOutletContext } from 'react-router';
import { Plus } from 'lucide-react';

import type { Route } from './+types/members-index';

import { IconNavLink } from '~/components/ui/button';
import type { OrganizationsOutletContextType } from '~/routes/layouts/organizations/organizations-layout';

export default function MembersIndex({ params }: Route.ComponentProps) {
  const { data } = useOutletContext<OrganizationsOutletContextType>();

  return (
    <>
      <section className='p-4'>
        <div className='flex items-center justify-between'>
          <h2>Team Members</h2>
          <div>
            {data.member.role === 'owner' || data.member.role === 'admin' ? (
              <IconNavLink
                to={`/${params.organizationId}/members/invite-member`}
                icon={Plus}
                className='rounded-lg border p-2'
              />
            ) : null}
          </div>
        </div>
      </section>
      <Outlet context={{ data }} />
    </>
  );
}

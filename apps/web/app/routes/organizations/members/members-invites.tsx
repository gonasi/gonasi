import { useOutletContext } from 'react-router';

import type { Route } from './+types/members-index';

import type { OrganizationsOutletContextType } from '~/routes/layouts/organizations/organizations-layout';

export default function MembersInvites({ params }: Route.ComponentProps) {
  const { data } = useOutletContext<OrganizationsOutletContextType>();

  return (
    <>
      <h1>hello members</h1>
    </>
  );
}

import { useOutletContext } from 'react-router';
import { Pencil } from 'lucide-react';

import type { Route } from './+types/organization-profile';

import { PlainAvatar } from '~/components/avatars';
import { IconNavLink } from '~/components/ui/button';
import type { OrganizationsOutletContextType } from '~/routes/layouts/organizations/organizations-layout';

export default function OrganizationProfile({ params }: Route.ComponentProps) {
  const {
    data: {
      organization: { name, avatar_url },
    },
  } = useOutletContext<OrganizationsOutletContextType>();

  return (
    <div className='flex max-w-lg flex-col space-y-10 md:space-y-12'>
      <div className='flex w-full flex-col items-center space-y-8 p-0 md:flex-row md:space-y-0 md:space-x-8'>
        <div>hey</div>
        <div className='relative'>
          <PlainAvatar username={name ?? ''} imageUrl={avatar_url} size='xl' />
          <IconNavLink
            to={`/${params.organizationId}/settings/organization-profile/profile-photo`}
            icon={Pencil}
            className='bg-card border-background absolute -top-4 -right-4 flex-shrink-0 rounded-full border-2 p-2'
            size={20}
          />
        </div>
      </div>
    </div>
  );
}

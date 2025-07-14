import { Pencil } from 'lucide-react';

import { getOrganizationProfile } from '@gonasi/database/organizations';

import type { Route } from './+types/organization-profile';

import { PlainAvatar } from '~/components/avatars';
import { NotFoundCard } from '~/components/cards';
import { IconNavLink } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const organizationProfile = await getOrganizationProfile({
    supabase,
    organizationId: params.organizationId,
  });

  return organizationProfile;
}

export default function OrganizationProfile({ params, loaderData }: Route.ComponentProps) {
  if (!loaderData) {
    return (
      <div>
        <NotFoundCard message='Could not load Organization profile' />
      </div>
    );
  }
  return (
    <div className='flex max-w-lg flex-col space-y-10 md:space-y-12'>
      <div className='flex w-full flex-col items-center space-y-8 p-0 md:flex-row md:space-y-0 md:space-x-8'>
        <div>hey</div>
        <div className='relative'>
          <PlainAvatar
            username={loaderData.name}
            imageUrl={loaderData.signed_avatar_url}
            size='xl'
          />
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

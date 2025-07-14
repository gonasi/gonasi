import { Pencil } from 'lucide-react';

import { getOrganizationProfile } from '@gonasi/database/organizations';

import type { Route } from './+types/organization-profile';

import { PlainAvatar } from '~/components/avatars';
import { NotFoundCard } from '~/components/cards';
import { GoThumbnail } from '~/components/cards/go-course-card';
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
      <div className='max-w-lg p-4'>
        <NotFoundCard message='Could not load Organization profile' />
      </div>
    );
  }
  return (
    <div className='flex max-w-xl flex-col space-y-10 pl-4 md:space-y-12'>
      <div className='relative w-full'>
        {/* Banner background */}
        <div className='w-full rounded-lg bg-blue-400'>
          <div className='relative'>
            <GoThumbnail
              iconUrl={null}
              blurHash={null}
              name=''
              aspectRatio='263/100'
              noThumbnailText='No banner available'
            />
            <IconNavLink
              to={`/${params.organizationId}/settings/organization-profile/profile-photo`}
              icon={Pencil}
              className='bg-card border-background absolute -top-4 -right-4 flex-shrink-0 rounded-full border-2 p-2'
              size={20}
            />
          </div>
        </div>

        {/* Avatar at the bottom of the banner */}
        <div className='absolute bottom-0 left-4 z-10 translate-y-1/2'>
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

      <div className='md:bg-card/50 flex w-full justify-between rounded-lg bg-transparent p-0 md:p-4'>
        <div>
          <h3 className='text-lg'>{loaderData.name}</h3>
          <h4 className='font-secondary text-muted-foreground text-sm'>{loaderData.handle}</h4>
          <p className='text-muted-foreground font-secondary text-xs'>{loaderData.website_url}</p>
        </div>
        <div>
          <IconNavLink
            to={`/${params.organizationId}/settings/profile-information/personal-information`}
            icon={Pencil}
            className='bg-card border-background flex-shrink-0 rounded-full border-2 p-2'
            size={20}
          />
        </div>
      </div>
    </div>
  );
}

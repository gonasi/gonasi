import { redirectWithError } from 'remix-toast';

import { fetchPublicOrganizationProfile } from '@gonasi/database/organizations';

import type { Route } from './+types/public-organization-profile-index';

import { PlainAvatar } from '~/components/avatars';
import { GoThumbnail } from '~/components/cards/go-course-card';
import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const organization = await fetchPublicOrganizationProfile({
    supabase,
    handle: params.organizationHandle,
  });

  if (!organization) {
    return redirectWithError('/', 'Organization not found. Please check the handle.');
  }

  return organization;
}

export function meta({ data }: Route.MetaArgs) {
  if (!data) {
    return [
      { title: 'Organization Not Found • Gonasi' },
      {
        name: 'description',
        content: 'The requested organization profile could not be found.',
      },
    ];
  }

  const { name, handle, description, signed_banner_url, signed_avatar_url } = data;

  return [
    { title: `${name} (@${handle}) • Gonasi` },
    {
      name: 'description',
      content: description || `View ${name}'s public profile on Gonasi.`,
    },
    {
      property: 'og:title',
      content: `${name} (@${handle}) • Gonasi`,
    },
    {
      property: 'og:description',
      content: description || '',
    },
    ...(signed_banner_url || signed_avatar_url
      ? [
          {
            property: 'og:image',
            content: signed_banner_url || signed_avatar_url,
          },
        ]
      : []),
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
  ];
}

export default function PublicOrganizationProfileIndex({ loaderData }: Route.ComponentProps) {
  return (
    <div className='mx-auto max-w-3xl'>
      <div className='relative w-full'>
        {/* Banner background */}
        <div className='w-full rounded-lg'>
          <div className='relative'>
            <GoThumbnail
              iconUrl={loaderData.signed_banner_url ?? ''}
              blurHash={loaderData.banner_blur_hash}
              name={`${loaderData.name}'s banner image`}
              aspectRatio='263/100'
              noThumbnailText='No banner available'
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
          </div>
        </div>
      </div>

      <div className='px-4 pt-12'>
        <h1 className='text-xl font-bold'>{loaderData.name}</h1>
        <p className='text-muted-foreground'>@{loaderData.handle}</p>
        {loaderData.description && (
          <p className='font-secondary mt-4 text-sm'>{loaderData.description}</p>
        )}
      </div>
    </div>
  );
}

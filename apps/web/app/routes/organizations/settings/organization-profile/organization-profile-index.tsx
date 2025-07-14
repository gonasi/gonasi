import { Outlet } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import { getValidatedFormData } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import type z from 'zod';

import {
  getOrganizationProfile,
  updateOrganizationProfilePicture,
} from '@gonasi/database/organizations';
import { OrganizationSettingsUpdateSchema } from '@gonasi/schemas/organizations/settings/profile';

import type { Route } from './+types/organization-profile-index';

import { PlainAvatar } from '~/components/avatars';
import { NotFoundCard } from '~/components/cards';
import { GoThumbnail } from '~/components/cards/go-course-card';
import { IconNavLink } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const organizationProfile = await getOrganizationProfile({
    supabase,
    organizationId: params.organizationId,
  });

  return organizationProfile;
}

type FormData = z.infer<typeof OrganizationSettingsUpdateSchema>;

export async function action({ request, params }: Route.ActionArgs) {
  const rawFormData = await request.formData();
  await checkHoneypot(rawFormData);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<FormData>(
    rawFormData,
    zodResolver(OrganizationSettingsUpdateSchema),
  );

  if (errors || !data) return { errors, defaultValues };

  const { supabase } = createClient(request);

  try {
    let result = { success: false, message: '', data: null };

    switch (data.updateType) {
      case 'organization-profile-picture':
        result = await updateOrganizationProfilePicture({ supabase, data });
        break;
      // case 'profile-picture':
      //   result = await updateProfilePicture(supabase, data);
      //   break;
      // case 'profile-visibility':
      //   result = await updateProfileVisibility(supabase, data);
      //   break;
      default:
        throw new Error(`Unsupported update type: ${data}`);
    }

    const returnPath = `/${params.organizationId}/settings/profile-information`;

    return result.success
      ? redirectWithSuccess(returnPath, result.message)
      : dataWithError(null, result.message);
  } catch (error) {
    console.error('Failed to update profile settings:', error);
    return dataWithError(null, 'Update failed. Please try again.');
  }
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
    <>
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
                to={`/${params.organizationId}/settings/organization-profile/update-profile-photo`}
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
                to={`/${params.organizationId}/settings/organization-profile/update-profile-photo`}
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
      <Outlet context={{ data: loaderData }} />
    </>
  );
}

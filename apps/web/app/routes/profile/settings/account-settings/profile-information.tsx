import { Outlet } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import { getValidatedFormData } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import type z from 'zod';

import { updatePersonalInformation, updateProfilePicture } from '@gonasi/database/profile';
import { getMyOwnProfile } from '@gonasi/database/profiles';
import { AccountSettingsUpdateSchema } from '@gonasi/schemas/settings';

import type { Route } from './+types/profile-information';

import { PlainAvatar } from '~/components/avatars';
import { NotFoundCard } from '~/components/cards';
import { IconNavLink } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';

export type ProfileLoaderReturnType = Exclude<Awaited<ReturnType<typeof loader>>, Response>;

export function meta({ data }: Route.MetaArgs) {
  const profile = (data as ProfileLoaderReturnType | null)?.profileUser;

  if (!profile) {
    return [
      { title: 'User Not Found • Gonasi' },
      { name: 'description', content: 'The requested user profile could not be found.' },
    ];
  }

  const { username, full_name } = profile;
  const displayName = full_name || username;

  return [
    { title: `${displayName} • Profile Settings • Gonasi` },
    {
      name: 'description',
      content: `Manage ${displayName}'s profile settings including name, avatar, and visibility options.`,
    },
  ];
}

type FormData = z.infer<typeof AccountSettingsUpdateSchema>;

interface UpdateResult {
  success: boolean;
  message: string;
  data: {
    username: string | null;
  } | null;
}

export async function action({ request, params }: Route.ActionArgs) {
  const rawFormData = await request.formData();
  await checkHoneypot(rawFormData);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<FormData>(rawFormData, zodResolver(AccountSettingsUpdateSchema));

  if (errors || !data) return { errors, defaultValues };

  const { supabase } = createClient(request);

  try {
    let result: UpdateResult = { success: false, message: '', data: null };

    switch (data.updateType) {
      case 'personal-information':
        result = await updatePersonalInformation(supabase, data);
        break;
      case 'profile-picture':
        result = await updateProfilePicture(supabase, data);
        break;
      default:
        throw new Error(`Unsupported update type: ${data}`);
    }

    const returnPath = `/go/${result.data?.username ?? params.username}/settings/profile-information`;

    return result.success
      ? redirectWithSuccess(returnPath, result.message)
      : dataWithError(null, result.message);
  } catch (error) {
    console.error('Failed to update profile settings:', error);
    return dataWithError(null, 'Update failed. Please try again.');
  }
}

export interface ProfileOutletContext {
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const profileUser = await getMyOwnProfile(supabase);
  return { profileUser };
}

export default function ProfileInformationSettings({ params, loaderData }: Route.ComponentProps) {
  if (!loaderData) return <NotFoundCard message='Profile not found' />;

  const { profileUser } = loaderData;

  return (
    <>
      <div className='w-full'>
        <div className='flex w-full flex-col items-center space-y-8 p-0 md:flex-row md:space-y-0 md:space-x-8'>
          <div className='relative'>
            <PlainAvatar
              username={profileUser?.username ?? ''}
              imageUrl={profileUser?.signed_url}
              size='xl'
            />
            <IconNavLink
              to={`/go/${params.username}/settings/profile-information/profile-photo`}
              icon={Pencil}
              className='bg-card border-background absolute -top-4 -right-4 flex-shrink-0 rounded-full border-2 p-2'
              size={24}
            />
          </div>

          <div className='md:bg-card/50 flex w-full justify-between rounded-lg bg-transparent p-0 md:p-4'>
            <div>
              <h4>{profileUser?.username}</h4>
              <h5 className='font-secondary text-sm'>{profileUser?.full_name}</h5>
              <p className='text-muted-foreground font-secondary text-xs'>{profileUser?.email}</p>
            </div>
            <div>
              <IconNavLink
                to={`/go/${params.username}/settings/profile-information/personal-information`}
                icon={Pencil}
                className='bg-card border-background flex-shrink-0 rounded-full border-2 p-2'
                size={24}
              />
            </div>
          </div>
        </div>
      </div>

      <Outlet
        context={{
          username: profileUser?.username ?? '',
          fullName: profileUser?.full_name ?? '',
          avatarUrl: profileUser?.avatar_url ?? '',
          email: profileUser?.email ?? '',
        }}
      />
    </>
  );
}

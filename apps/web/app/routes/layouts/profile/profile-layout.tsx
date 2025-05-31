import { Outlet, useOutletContext } from 'react-router';

import { getProfileByUsername } from '@gonasi/database/profiles';

import type { Route } from './+types/profile-layout';

import { createClient } from '~/lib/supabase/supabase.server';
import type { AppOutletContext } from '~/root';

export type ProfileLoaderReturnType = Exclude<Awaited<ReturnType<typeof loader>>, Response>;

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const profileUser = await getProfileByUsername({
    supabase,
    username: params.username ?? '',
  });

  console.log(profileUser);

  return profileUser;
}

export default function ProfileLayout({ loaderData: profileUser }: Route.ComponentProps) {
  const { user, role, activeCompany } = useOutletContext<AppOutletContext>();

  return (
    <div>
      <Outlet context={{ profileUser, user, role, activeCompany }} />
    </div>
  );
}

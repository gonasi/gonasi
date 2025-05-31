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

  return profileUser;
}

export default function ProfileLayout({ loaderData: profileUser }: Route.ComponentProps) {
  const { user, role, activeCompany } = useOutletContext<AppOutletContext>();

  return (
    <section className='mx-auto max-w-2xl px-4 py-10'>
      <Outlet context={{ profileUser, user, role, activeCompany }} />
    </section>
  );
}

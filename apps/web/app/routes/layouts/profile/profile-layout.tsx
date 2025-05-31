import { Suspense } from 'react';
import { Await, Outlet, useLoaderData, useOutletContext } from 'react-router';

import { getProfileByUsername } from '@gonasi/database/profiles';

import type { Route } from './+types/profile-layout';

import { NotFoundCard } from '~/components/cards';
import { Spinner } from '~/components/loaders';
import { createClient } from '~/lib/supabase/supabase.server';
import type { AppOutletContext } from '~/root';

export type ProfileLoaderReturnType = Exclude<Awaited<ReturnType<typeof loader>>, Response>;

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const profileUser = getProfileByUsername({
    supabase,
    username: params.username ?? '',
  });

  return profileUser;
}

export default function ProfileLayout() {
  const profileUser = useLoaderData();

  const { user, role, activeCompany } = useOutletContext<AppOutletContext>();

  return (
    <section className='mx-auto max-w-2xl px-4 py-10'>
      <Suspense fallback={<Spinner />}>
        <Await
          resolve={profileUser}
          errorElement={<NotFoundCard message='Could not load profile' />}
        >
          {(resolvedProfileUser) => (
            <Outlet context={{ profileUser: resolvedProfileUser, user, role, activeCompany }} />
          )}
        </Await>
      </Suspense>
    </section>
  );
}

import { useEffect } from 'react';
import { data, Outlet, redirect, useNavigate, useOutletContext } from 'react-router';

import { getUserProfile } from '@gonasi/database/profile';

import type { Route } from './+types/auth-layout';

import { Spinner } from '~/components/loaders';
import { createClient } from '~/lib/supabase/supabase.server';
import type { AppOutletContext } from '~/root';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { user } = await getUserProfile(supabase);

  if (user) return redirect('/');
  return data({ success: true });
}

export default function AuthLayout() {
  const { user } = useOutletContext<AppOutletContext>();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  if (user) return <Spinner />;

  return (
    <section className='mx-auto mt-0 max-w-lg md:mt-16'>
      <Outlet />
    </section>
  );
}

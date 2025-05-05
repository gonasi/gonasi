import { data, Outlet, redirect } from 'react-router';

import { getUserProfile } from '@gonasi/database/profile';

import type { Route } from './+types/public-layout';

import { TopNav } from '~/components/go-top-nav';
import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const { user } = await getUserProfile(supabase);

  return user ? redirect('/go') : data({ success: true });
}

export default function PublicLayout() {
  return (
    <div>
      <TopNav activeCompany={null} />
      <section className='container mx-auto'>
        <Outlet />
      </section>
    </div>
  );
}

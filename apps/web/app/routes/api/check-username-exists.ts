import { data } from 'react-router';

import { checkUserNameExists } from '@gonasi/database/profile';

import type { Route } from './+types/check-username-exists';

import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const username = url.searchParams.get('username');

  console.log('username: ', username);

  if (!username) {
    return data({ exists: false }, { status: 400 });
  }

  const { supabase } = createClient(request);
  const exists = await checkUserNameExists(supabase, username);

  console.log('exists: ', exists);

  return data({ exists });
}

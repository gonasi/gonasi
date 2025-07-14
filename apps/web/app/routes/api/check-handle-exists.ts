import { data } from 'react-router';

import { checkHandleExists } from '@gonasi/database/organizations';

import type { Route } from './+types/check-handle-exists';

import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const handle = url.searchParams.get('handle');

  console.log('handle: ', handle);

  if (!handle) {
    return data({ exists: false }, { status: 400 });
  }

  const { supabase } = createClient(request);
  const exists = await checkHandleExists({
    supabase,
    handle,
    organizationId: params.organizationId,
  });

  console.log('exists: ', exists);

  return data({ exists });
}

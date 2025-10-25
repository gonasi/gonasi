import { data } from 'react-router';

import { fetchOrganizationAiAvailableCredits } from '@gonasi/database/ai';

import type { Route } from './+types/check-handle-exists';

import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  console.log('params: ', params.organizationId);

  let credits = null;
  if (params.organizationId) {
    credits = await fetchOrganizationAiAvailableCredits({
      supabase,
      organizationId: params.organizationId,
    });
  }

  console.log(credits);

  return data({ credits });
}

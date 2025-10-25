import { fetchTotalEnrollmentStats } from '@gonasi/database/dashboard';

import type { Route } from './+types/fetch-total-courses-stats';

import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const { organizationId } = params;
  if (!organizationId) return null;

  const stats = await fetchTotalEnrollmentStats({
    supabase,
    organizationId,
  });

  return stats;
}

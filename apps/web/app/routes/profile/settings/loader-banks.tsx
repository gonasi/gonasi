import { fetchPaystackBankAccounts } from '@gonasi/database/settings';

import type { Route } from './+types/loader-banks';

import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const data = await fetchPaystackBankAccounts({
    supabase,
    currency: params.currency ?? 'KES',
    type: params.type ?? 'kepss',
  });

  console.log('data: ', data);

  return data;
}

export default function LoaderBanks() {
  return <></>;
}

import type { Route } from './+types/pricing';

import { NotFoundCard } from '~/components/cards';
import { createClient } from '~/lib/supabase/supabase.server';

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const { data } = await supabase.from('tier_limits').select();

  return data;
}

export default function Pricing({ loaderData }: Route.ComponentProps) {
  if (!loaderData) {
  }
  return (
    <div className='mx-auto max-w-2xl'>
      {loaderData && loaderData.length ? (
        loaderData.map((item, index) => <div key={index}>{item.tier}</div>)
      ) : (
        <NotFoundCard message='not found' />
      )}
    </div>
  );
}

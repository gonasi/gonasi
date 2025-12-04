import type { Route } from './+types/pricing';

import { NotFoundCard } from '~/components/cards';
import { createClient } from '~/lib/supabase/supabase.server';
import { generateMetaTags } from '~/utils/seo';

export function meta() {
  const siteUrl = 'https://gonasi.com';

  return generateMetaTags(
    {
      title: 'Pricing Plans • Gonasi',
      description:
        'Choose the perfect plan for your learning needs. From free forever plans to enterprise solutions, Gonasi has flexible pricing for educators and organizations.',
      keywords:
        'Gonasi pricing, LMS pricing, course builder pricing, education platform pricing, free LMS, affordable online learning',
      url: `${siteUrl}/pricing`,
      type: 'website',
    },
    siteUrl,
  );
}

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

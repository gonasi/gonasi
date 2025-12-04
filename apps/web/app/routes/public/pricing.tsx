import type { Route } from './+types/pricing';

import { NotFoundCard } from '~/components/cards';
import { createClient } from '~/lib/supabase/supabase.server';
import { generateMetaTags } from '~/utils/seo';

export function meta() {
  const siteUrl = 'https://gonasi.com';

  return generateMetaTags(
    {
      title: 'Gonasi Pricing - Build Interactive Learning | Kahoot Alternative Plans',
      description:
        'Affordable pricing for creators to build interactive learning. Gonasi offers creator-friendly plans as a Kahoot alternative and Brilliant.org-style course builder. Tools to build gamified quizzes, interactive courses, and live audience experiences. Free plans available for educators and organizations.',
      keywords:
        'gonasi pricing, build interactive learning pricing, kahoot alternative pricing, course builder pricing, interactive learning creator tools pricing, gamified quiz builder pricing, live quiz platform pricing, brilliant.org alternative pricing, free course builder, affordable creator platform',
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

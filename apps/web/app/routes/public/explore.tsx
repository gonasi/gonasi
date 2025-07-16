import { Suspense } from 'react';
import { Await, NavLink, useLoaderData, useLocation } from 'react-router';
import { Play } from 'lucide-react';

import { fetchPublishedPublicCourses } from '@gonasi/database/publishedCourses';

import type { Route } from './+types/home';

import { UserAvatar } from '~/components/avatars';
import { NotFoundCard } from '~/components/cards';
import { GoCardContent, GoCourseHeader, GoThumbnail } from '~/components/cards/go-course-card';
import { GoPricingSheet } from '~/components/cards/go-course-card/GoPricingSheet';
import { Spinner } from '~/components/loaders';
import { Badge } from '~/components/ui/badge';
import { NavLinkButton } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';

export function meta() {
  return [
    { title: 'Explore Courses • Gonasi' },
    {
      name: 'description',
      content:
        'Explore interactive courses on Gonasi. Engage with dynamic challenges, real-time feedback, and personalized learning journeys.',
    },
    {
      name: 'keywords',
      content:
        'Gonasi, interactive courses, online learning, e-learning platform, explore courses, no-code education, dynamic learning',
    },
    { name: 'robots', content: 'index, follow' },
    { name: 'author', content: 'Gonasi Team' },
    { property: 'og:title', content: 'Explore Courses • Gonasi' },
    {
      property: 'og:description',
      content:
        'Browse interactive learning experiences built to engage and educate—only on Gonasi.',
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://gonasi.com/go/explore' },
    { property: 'og:image', content: 'https://gonasi.com/assets/images/seo/logo.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Explore Courses • Gonasi' },
    {
      name: 'twitter:description',
      content: 'Find and explore engaging interactive courses on Gonasi today.',
    },
    { name: 'twitter:image', content: 'https://gonasi.com/assets/images/seo/logo.png' },
  ];
}

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const { supabase } = createClient(request);
    const url = new URL(request.url);

    const courseNameFilter = url.searchParams.get('name') ?? '';
    const currentPage = Number(url.searchParams.get('page')) || 1;
    const resultsPerPage = 12;

    const publishedCourses = fetchPublishedPublicCourses({
      supabase,
      searchQuery: courseNameFilter,
      limit: resultsPerPage,
      page: currentPage,
    });

    return { publishedCourses };
  } catch (e) {
    console.error('Loader failed:', e);
    throw e;
  }
}

export default function Explore() {
  const { publishedCourses } = useLoaderData() as {
    publishedCourses: ReturnType<typeof fetchPublishedPublicCourses>;
  };

  const location = useLocation();

  const redirectTo = location.pathname + location.search;

  return (
    <div className='container mx-auto min-h-screen space-y-4 px-0 pb-10 md:px-4'>
      <div className='py-4'>
        <Suspense fallback={<Spinner />}>
          <Await
            resolve={publishedCourses}
            errorElement={<NotFoundCard message='Failed to load courses.' />}
          >
            {(resolvedCourses) =>
              resolvedCourses.data.length ? (
                <div className='grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-3 lg:grid-cols-4'>
                  {resolvedCourses.data.map(
                    ({
                      id,
                      name,
                      description,
                      image_url,
                      blur_hash,
                      pricing_tiers,
                      enrollment,
                      organizations: { handle, name: orgName, avatar_url },
                    }) => {
                      console.log('course enroll: ', enrollment);
                      return (
                        <NavLink
                          key={id}
                          to={`/c/${id}?${new URLSearchParams({ redirectTo })}`}
                          className={cn('pb-4 hover:cursor-pointer md:pb-0')}
                        >
                          {({ isPending }) => (
                            <div
                              className={cn(
                                'group md:bg-card/80 m-0 rounded-none border-none bg-transparent p-0 shadow-none',
                                isPending && 'bg-primary/5 animate-pulse hover:cursor-not-allowed',
                              )}
                            >
                              <GoThumbnail
                                iconUrl={image_url}
                                blurHash={blur_hash}
                                name={name}
                                className='rounded-t-none'
                                badges={[
                                  enrollment && enrollment.is_active && (
                                    <Badge variant='success'>Active</Badge>
                                  ),
                                ]}
                              />
                              <GoCardContent>
                                <GoCourseHeader
                                  className='text-md line-clamp-2 h-fit md:h-12'
                                  name={name}
                                />
                                <p className='font-secondary text-muted-foreground line-clamp-1 text-sm'>
                                  {description}
                                </p>
                                <div className='pt-2'>
                                  <NavLink to={`/${handle}`}>
                                    {({ isPending }) => (
                                      <UserAvatar
                                        username={orgName}
                                        imageUrl={avatar_url}
                                        size='xs'
                                        isPending={isPending}
                                        alwaysShowUsername
                                      />
                                    )}
                                  </NavLink>
                                </div>
                                <div className='flex w-full items-center justify-between'>
                                  <div />
                                  <div className='py-2'>
                                    {enrollment && enrollment.is_active ? (
                                      <div className='py-1'>
                                        <NavLinkButton
                                          to={`/c/${id}?${new URLSearchParams({ redirectTo })}`}
                                          rightIcon={<Play />}
                                          variant='secondary'
                                        >
                                          Resume Course
                                        </NavLinkButton>
                                      </div>
                                    ) : (
                                      <GoPricingSheet pricingData={pricing_tiers} />
                                    )}
                                  </div>
                                </div>
                              </GoCardContent>
                            </div>
                          )}
                        </NavLink>
                      );
                    },
                  )}
                </div>
              ) : (
                <NotFoundCard message='No published courses found' />
              )
            }
          </Await>
        </Suspense>
      </div>
    </div>
  );
}

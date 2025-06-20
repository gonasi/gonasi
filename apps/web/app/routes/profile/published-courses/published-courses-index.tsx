import { Suspense } from 'react';
import { Await, NavLink, useLoaderData } from 'react-router';

import { fetchPublishedCoursesByUser } from '@gonasi/database/publishedCourses';

import type { Route } from './+types/published-courses-index';

import { NotFoundCard } from '~/components/cards';
import { GoCardContent, GoCourseHeader, GoThumbnail } from '~/components/cards/go-course-card';
import { GoPricingSheet } from '~/components/cards/go-course-card/GoPricingSheet';
import { Spinner } from '~/components/loaders';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';

// Meta
export function meta({ params }: Route.MetaArgs) {
  const username = params.username;
  return [
    {
      title: `Published Courses by ${username} | Gonasi`,
    },
    {
      name: 'description',
      content: `Explore published courses by ${username} on Gonasi — featuring high-quality interactive content designed for learners.`,
    },
  ];
}

// Loader
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('name') ?? '';
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = 12;

  // Awaited immediately
  const publishedCoursesPromise = fetchPublishedCoursesByUser({
    supabase,
    searchQuery: search,
    limit,
    page,
    username: params.username ?? '',
  });

  return {
    publishedCourses: publishedCoursesPromise, // not awaited
  };
}

// Component
export default function PublishedCourses({ params }: Route.ComponentProps) {
  const { publishedCourses } = useLoaderData() as {
    publishedCourses: ReturnType<typeof fetchPublishedCoursesByUser>;
  };

  const { username } = params;

  return (
    <div className='flex min-h-screen flex-col space-y-4 pb-10'>
      <Suspense fallback={<Spinner />}>
        <Await
          resolve={publishedCourses}
          errorElement={<NotFoundCard message='Failed to load courses.' />}
        >
          {(resolvedCourses) =>
            resolvedCourses.data.length ? (
              <div className='grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-2 lg:grid-cols-3'>
                {resolvedCourses.data.map(({ id, name, signed_url, blur_hash, pricing_data }) => (
                  <NavLink
                    key={id}
                    to={`/${username}/course-builder/${id}/overview`}
                    className={cn('pb-4 hover:cursor-pointer md:pb-0')}
                  >
                    {({ isPending }) => (
                      <div
                        className={cn(
                          'group md:bg-card/80 m-0 rounded-none border-none bg-transparent p-0 shadow-none',
                          isPending && 'bg-primary/5',
                        )}
                      >
                        <GoThumbnail
                          iconUrl={signed_url}
                          blurHash={blur_hash}
                          name={name}
                          className='rounded-t-none'
                          badges={['ugali', 'mboga']}
                        />
                        <GoCardContent>
                          <GoCourseHeader
                            className='line-clamp-2 text-sm'
                            name='som aksdflkasdf jkasldfasadf kasdkf jaklsdfj askldfj aklsdjf aklsdjf lkasdf'
                          />

                          <div className='flex w-full justify-end'>
                            <GoPricingSheet pricingData={pricing_data} />
                          </div>
                        </GoCardContent>
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
            ) : (
              <NotFoundCard message='No published courses found' />
            )
          }
        </Await>
      </Suspense>
    </div>
  );
}

import { Suspense } from 'react';
import { Await, NavLink, useLoaderData, useLocation } from 'react-router';

import { fetchUsersActivelyEnrolledCourses } from '@gonasi/database/publishedCourses';

import type { Route } from './+types/learning-index';

import { UserAvatar } from '~/components/avatars';
import { NotFoundCard } from '~/components/cards';
import { GoCardContent, GoCourseHeader, GoThumbnail } from '~/components/cards/go-course-card';
import { Spinner } from '~/components/loaders';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';

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

    const activeLearning = fetchUsersActivelyEnrolledCourses({
      supabase,
      searchQuery: courseNameFilter,
      limit: resultsPerPage,
      page: currentPage,
    });

    return { activeLearning };
  } catch (e) {
    console.error('Loader failed:', e);
    throw e;
  }
}

export default function LearningIndex() {
  const { activeLearning } = useLoaderData() as {
    activeLearning: ReturnType<typeof fetchUsersActivelyEnrolledCourses>;
  };

  const location = useLocation();

  const redirectTo = location.pathname + location.search;

  return (
    <Suspense fallback={<Spinner />}>
      <Await
        resolve={activeLearning}
        errorElement={<NotFoundCard message='Failed to load active learning.' />}
      >
        {(resolvedCourses) =>
          resolvedCourses.data.length ? (
            <div className='grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-3 lg:grid-cols-3'>
              {resolvedCourses.data.map(
                ({
                  id,
                  name,
                  description,
                  image_url,
                  blur_hash,
                  organizations: { handle, name: orgName, avatar_url },
                }) => (
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
                        />
                        <GoCardContent>
                          <GoCourseHeader
                            className='text-md line-clamp-2 h-fit md:h-12'
                            name={name}
                          />
                          <p className='font-secondary text-muted-foreground line-clamp-1 text-sm'>
                            {description}
                          </p>
                          <div className='py-2'>
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
                        </GoCardContent>
                      </div>
                    )}
                  </NavLink>
                ),
              )}
            </div>
          ) : (
            <NotFoundCard message='No published courses found' />
          )
        }
      </Await>
    </Suspense>
  );
}

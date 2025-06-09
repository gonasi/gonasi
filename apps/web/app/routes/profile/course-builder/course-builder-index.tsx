import { Suspense } from 'react';
import { Await, data, NavLink, Outlet } from 'react-router';
import { Plus } from 'lucide-react';

import { fetchCoursesForOwnerOrCollaborators } from '@gonasi/database/courses';

import type { Route } from './+types/course-builder-index';

import { NotFoundCard } from '~/components/cards';
import { GoCardContent, GoCourseHeader, GoThumbnail } from '~/components/cards/go-course-card';
import { ErrorMessageWithRetry } from '~/components/error-message-with-retry';
import { CourseProfileCardSkeleton } from '~/components/skeletons';
import { FloatingActionButton } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';

// Metadata for SEO
export function meta({ params }: Route.MetaArgs) {
  const username = params.username;
  return [
    {
      title: `Courses by ${username} | Gonasi`,
    },
    {
      name: 'description',
      content: `Explore ${username}'s interactive courses on Gonasi — including published content and in-progress lessons.`,
    },
  ];
}

// Cache headers
export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

// Types
export type AllCoursesData = Exclude<Awaited<ReturnType<typeof loader>>, Response>['data'];

export type CoursesPromiseType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data']['coursesPromise'];

type CoursesData = Awaited<CoursesPromiseType>['data'];

// Loader
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('name') ?? '';
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = 12;

  const coursesPromise = fetchCoursesForOwnerOrCollaborators({
    supabase,
    searchQuery: search,
    limit,
    page,
    username: params.username ?? '',
  });

  return data({ coursesPromise });
}

// Courses Grid
function CoursesGrid({
  courses,
  totalCount,
  username,
}: {
  courses: CoursesData;
  totalCount: number;
  username: string;
}) {
  if (!courses?.length) {
    return <NotFoundCard message='No courses published' />;
  }

  return (
    <div className='flex flex-col space-y-4 pb-10'>
      <div className='grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-2 lg:grid-cols-3'>
        {courses.map(({ id, name, signed_url, blur_hash }) => {
          return (
            <NavLink
              key={id}
              to={`/${username}/course-builder/${id}/overview`}
              className={cn('pb-4 hover:cursor-pointer md:pb-0')}
            >
              {({ isPending }) => (
                <div
                  className={cn(
                    'group md:bg-card/80 m-0 rounded-none border-none bg-transparent p-0 shadow-none md:rounded-md',
                    isPending && 'bg-primary/5',
                  )}
                >
                  <GoThumbnail
                    iconUrl={signed_url}
                    blurHash={blur_hash}
                    name={name}
                    className='rounded-t-none md:rounded-t-md'
                  />
                  <GoCardContent>
                    <GoCourseHeader className='line-clamp-1 text-sm' name={name} />
                  </GoCardContent>
                </div>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

// Main Component
export default function ViewAllCourses({ loaderData, params }: Route.ComponentProps) {
  const { coursesPromise } = loaderData;
  const username = params.username ?? '';

  return (
    <div>
      <Suspense fallback={<CourseProfileCardSkeleton />}>
        <Await
          resolve={coursesPromise}
          errorElement={<ErrorMessageWithRetry message='Could not load courses' />}
        >
          {(resolved) => (
            <CoursesGrid
              courses={resolved.data}
              totalCount={resolved.count ?? 0}
              username={username}
            />
          )}
        </Await>
      </Suspense>

      <FloatingActionButton
        to={`/${username}/course-builder/new`}
        tooltip='New course'
        icon={<Plus size={20} strokeWidth={4} />}
      />

      <Outlet />
    </div>
  );
}

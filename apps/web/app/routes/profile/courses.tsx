import { Suspense } from 'react';
import { Await, data } from 'react-router';
import { Plus } from 'lucide-react';

import { fetchCompanyCoursesWithSignedUrlsBySuOrAdmin } from '@gonasi/database/courses';

import type { Route } from './+types/courses';

import { CourseCard, NotFoundCard } from '~/components/cards';
import { ErrorMessageWithRetry } from '~/components/error-message-with-retry';
import { CourseProfileCardSkeleton } from '~/components/skeletons';
import { FloatingActionButton } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';

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

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

export type AllCoursesLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data'];

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const url = new URL(request.url);
  const searchQuery = url.searchParams.get('name') ?? '';
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = 12;

  // Return the promise without awaiting - this allows streaming
  const coursesPromise = fetchCompanyCoursesWithSignedUrlsBySuOrAdmin({
    supabase,
    searchQuery,
    limit,
    page,
    username: params.username ?? '',
  });

  return data({ coursesPromise });
}

// Component to render the courses list
function CoursesList({ courses, count, params }: { courses: any[]; count: number; params: any }) {
  if (!courses?.length) {
    return <NotFoundCard message='No courses published' />;
  }

  return (
    <div className='flex flex-col space-y-4'>
      <div className='grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-4 lg:grid-cols-3'>
        {courses.map((course) => {
          const {
            id: courseId,
            name,
            description,
            signed_url,
            lesson_count,
            chapters_count,
            monthly_subscription_price,
            created_by_profile,
            status,
            updated_at,
          } = course;

          return (
            <CourseCard
              key={courseId}
              name={name}
              description={description}
              iconUrl={signed_url}
              lessonsCount={lesson_count}
              chaptersCount={chapters_count}
              price={monthly_subscription_price}
              to={`/dashboard/${params.companyId}/courses/${courseId}/course-details`}
              author={{
                displayName:
                  created_by_profile.username ??
                  created_by_profile.full_name ??
                  created_by_profile.email,
                imageUrl: created_by_profile.avatar_url,
              }}
              category={course.course_categories?.name}
              subcategory={course.course_sub_categories?.name}
              updatedAt={updated_at}
              status={status}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function Courses({ loaderData, params }: Route.ComponentProps) {
  const { coursesPromise } = loaderData;

  return (
    <div>
      <Suspense fallback={<CourseProfileCardSkeleton />}>
        <Await
          resolve={coursesPromise}
          errorElement={<ErrorMessageWithRetry message='Could not load courses' />}
        >
          {(resolvedCourses) => (
            <CoursesList
              courses={resolvedCourses.data}
              count={resolvedCourses.count ?? 0}
              params={params}
            />
          )}
        </Await>
      </Suspense>
      <FloatingActionButton
        onClick={() => console.log('Upload')}
        tooltip='New Course'
        icon={<Plus size={20} strokeWidth={3} />}
        buttonProps={{ variant: 'secondary' }}
      />
    </div>
  );
}

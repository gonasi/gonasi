import { data } from 'react-router';

import { fetchCompanyCoursesWithSignedUrlsBySuOrAdmin } from '@gonasi/database/courses';

import type { Route } from './+types/all-courses';

import { CourseCard, NotFoundCard } from '~/components/cards';
import { ViewLayout } from '~/components/layouts/view/ViewLayout';
import { PaginationBar } from '~/components/search-params/pagination-bar/paginatinon-bar';
import { SearchInput } from '~/components/search-params/search-input';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [
    { title: 'My Courses | Gonasi' },
    {
      name: 'description',
      content:
        'View and manage your enrolled courses on Gonasi. Continue learning and track your progress easily.',
    },
  ];
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

  const courses = await fetchCompanyCoursesWithSignedUrlsBySuOrAdmin({
    supabase,
    searchQuery,
    limit,
    page,
    companyId: params.companyId,
  });

  return data(courses);
}

export default function AllMyCourses({ loaderData, params }: Route.ComponentProps) {
  const { data: courses, count } = loaderData;

  return (
    <ViewLayout title='Courses' newLink={`/dashboard/${params.companyId}/courses/new`}>
      <div className='pb-4'>
        <SearchInput placeholder='Search your courses...' />
      </div>

      {courses?.length ? (
        <div className='flex flex-col space-y-4'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
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
          <PaginationBar totalItems={count ?? 0} itemsPerPage={12} />
        </div>
      ) : (
        <NotFoundCard message='No courses found' />
      )}
    </ViewLayout>
  );
}

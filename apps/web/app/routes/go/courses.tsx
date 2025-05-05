import { data, Outlet } from 'react-router';
import { Telescope } from 'lucide-react';

import { fetchAllPublishedCoursesWithSignedUrl } from '@gonasi/database/courses';

import type { Route } from './+types/courses';

import { CourseCard, NotFoundCard } from '~/components/cards';
import { PaginationBar } from '~/components/search-params/pagination-bar/paginatinon-bar';
import { createClient } from '~/lib/supabase/supabase.server';

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

export function meta() {
  return [
    { title: 'Gonasi - Explore Courses' },
    {
      name: 'description',
      content:
        'Discover top-rated courses and personalized learning pathways on Gonasi. Continue where you left off and advance your skills today!',
    },
    {
      name: 'keywords',
      content:
        'online courses, learning platform, education, skills development, career growth, e-learning',
    },
    { name: 'author', content: 'Gonasi Team' },
    { name: 'robots', content: 'index, follow' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const url = new URL(request.url);
  const searchQuery = url.searchParams.get('name') ?? '';
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = 12;

  const courses = await fetchAllPublishedCoursesWithSignedUrl({
    supabase,
    searchQuery,
    limit,
    page,
  });

  return data(courses);
}

export default function Courses({ loaderData }: Route.ComponentProps) {
  const { data: courses, count } = loaderData;

  return (
    <>
      <section className='mx-auto max-w-[1100px] px-4 py-10 md:px-10'>
        <div>
          <div className='flex'>
            <h1 className='text-3xl font-bold'>Featured Courses</h1>
            <Telescope size={14} />
          </div>
          <p className='text-muted-foreground font-secondary text-sm'>
            Explore top-rated courses, specially selected and featured for you.
          </p>
        </div>

        {courses?.length ? (
          <section className='flex flex-col space-y-4'>
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
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
                    to={`/go/courses/${courseId}`}
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
          </section>
        ) : (
          <NotFoundCard message='No courses found' />
        )}
      </section>
      <Outlet />
    </>
  );
}

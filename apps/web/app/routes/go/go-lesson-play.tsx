import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router';
import { redirectWithError } from 'remix-toast';

import { fetchValidatedPublishedLessonById } from '@gonasi/database/lessons';

import type { Route } from './+types/go-lesson-play';

import { CoursePlayLayout } from '~/components/layouts/course';
import { Spinner } from '~/components/loaders';
import { createClient } from '~/lib/supabase/supabase.server';

// Lazily load the ViewPluginTypesRenderer
const ViewPluginTypesRenderer = lazy(() => import('~/components/plugins/viewPluginTypesRenderer'));

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [lesson] = await Promise.all([
    fetchValidatedPublishedLessonById(supabase, params.lessonId),
  ]);

  if (!lesson) {
    return redirectWithError(`/go/courses/${params.courseId}`, 'Lesson not found');
  }

  return { lesson };
}

export default function GoLessonPlay({ loaderData, params }: Route.ComponentProps) {
  const {
    lesson: { blocks },
  } = loaderData;

  return (
    <>
      <CoursePlayLayout to={`/go/courses/${params.courseId}`} progress={10} />
      <section className='mx-auto flex max-w-xl flex-col space-y-8 px-4 py-10 md:px-0'>
        {blocks && blocks.length > 0 ? (
          blocks.map((block) => (
            <Suspense key={block.id} fallback={<Spinner />}>
              <ViewPluginTypesRenderer block={block} mode='play' />
            </Suspense>
          ))
        ) : (
          <p>No blocks found</p>
        )}
      </section>
      <Outlet />
    </>
  );
}

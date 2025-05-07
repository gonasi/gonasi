import { lazy, memo, Suspense } from 'react';
import { Outlet } from 'react-router';
import { redirectWithError } from 'remix-toast';

// Import the LessonBlockLoaderReturnType (or ensure it's properly defined)
import {
  fetchUserLessonBlockInteractions,
  fetchValidatedPublishedLessonById,
} from '@gonasi/database/lessons';
import type { PluginTypeId } from '@gonasi/schemas/plugins';

import type { Route } from './+types/go-lesson-play';
import type { LessonBlockLoaderReturnType } from '../dashboard/courses/lessons/edit-plugin-modal';

import { CoursePlayLayout } from '~/components/layouts/course';
import { Spinner } from '~/components/loaders';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';

const ViewPluginTypesRenderer = lazy(() => import('~/components/plugins/viewPluginTypesRenderer'));

// Memoize the block rendering logic and assign a display name
const BlockRenderer = memo(({ block }: { block: LessonBlockLoaderReturnType }) => {
  return (
    <Suspense fallback={<Spinner />}>
      <ViewPluginTypesRenderer block={block} mode='play' />
    </Suspense>
  );
});

// Assign displayName to the memoized component
BlockRenderer.displayName = 'BlockRenderer';

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const pluginType = formData.get('intent') as PluginTypeId;
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [lesson, blockInteractions] = await Promise.all([
    fetchValidatedPublishedLessonById(supabase, params.lessonId),
    fetchUserLessonBlockInteractions({
      supabase,
      lessonId: params.lessonId,
    }),
  ]);

  if (!lesson) {
    return redirectWithError(`/go/courses/${params.courseId}`, 'Lesson not found');
  }

  console.log(lesson.blocks);

  return { lesson, blockInteractions };
}

export default function GoLessonPlay({ loaderData, params }: Route.ComponentProps) {
  const {
    lesson: { blocks },
    blockInteractions,
  } = loaderData;

  return (
    <>
      <CoursePlayLayout to={`/go/courses/${params.courseId}`} progress={10} />
      <section className='mx-auto flex max-w-xl flex-col space-y-8 px-4 py-10 md:px-0'>
        {blocks && blocks.length > 0 ? (
          blocks.map((block) => <BlockRenderer key={block.id} block={block} />)
        ) : (
          <p>No blocks found</p>
        )}
      </section>
      <Outlet />
    </>
  );
}

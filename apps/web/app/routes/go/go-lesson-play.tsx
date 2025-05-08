import { lazy, memo, Suspense, useEffect } from 'react';
import { Outlet } from 'react-router';
import { redirectWithError } from 'remix-toast';

import {
  createBlockInteraction,
  fetchUserLessonBlockInteractions,
  fetchValidatedPublishedLessonById,
} from '@gonasi/database/lessons';
import type { Interaction } from '@gonasi/schemas/plugins';

import type { Route } from './+types/go-lesson-play';
import type { LessonBlockLoaderReturnType } from '../dashboard/courses/lessons/edit-plugin-modal';

import { CoursePlayLayout } from '~/components/layouts/course';
import { Spinner } from '~/components/loaders';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

const ViewPluginTypesRenderer = lazy(() => import('~/components/plugins/viewPluginTypesRenderer'));

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

const BlockRenderer = memo(function BlockRenderer({
  block,
}: {
  block: LessonBlockLoaderReturnType;
}) {
  return (
    <Suspense fallback={<Spinner />}>
      <ViewPluginTypesRenderer block={block} mode='play' />
    </Suspense>
  );
});

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  const rawPayload = formData.get('payload');

  if (typeof rawPayload !== 'string') {
    throw new Response('Invalid payload format', { status: 400 });
  }

  let payload: Interaction;

  try {
    payload = JSON.parse(rawPayload);
  } catch {
    throw new Response('Failed to parse payload', { status: 400 });
  }

  const { supabase } = createClient(request);
  await createBlockInteraction(supabase, payload);

  return true;
}

export type GoLessonPlayInteractionReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['blockInteractions'];

export type GoLessonPlayLessonType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['lesson'];

export type GoLessonPlayLessonBlocksType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['lesson']['blocks'];

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

  return { lesson, blockInteractions };
}

export default function GoLessonPlay({ loaderData, params }: Route.ComponentProps) {
  const { visibleBlocks, initializePlayFlow } = useStore();

  const {
    lesson: { blocks },
    blockInteractions,
  } = loaderData;

  useEffect(() => {
    // Initialize the play flow when component mounts
    initializePlayFlow(blocks, blockInteractions);

    // Clean up when component unmounts
    return () => {
      useStore.getState().resetPlayFlow();
    };
  }, [blockInteractions, blocks, initializePlayFlow]);

  if (!visibleBlocks) return null;

  return (
    <>
      <CoursePlayLayout to={`/go/courses/${params.courseId}`} progress={10} />
      <section className='mx-auto flex max-w-xl flex-col space-y-8 px-4 py-10 md:px-0'>
        {visibleBlocks?.length > 0 ? (
          visibleBlocks.map((block) => <BlockRenderer key={block.id} block={block} />)
        ) : (
          <p>No blocks found</p>
        )}
      </section>

      <Outlet />
    </>
  );
}

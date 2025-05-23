import { lazy, Suspense, useEffect, useRef } from 'react';
import { Await, data, Outlet, redirect, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { dataWithError, redirectWithError } from 'remix-toast';

import { fetchNextChapterAndLessonId } from '@gonasi/database/courses';
import {
  createBlockInteraction,
  fetchLessonCompletionStatus,
  fetchUserLessonBlockInteractions,
  fetchValidatedPublishedLessonById,
} from '@gonasi/database/lessons';
import { interactionSchemaMap, type PluginTypeId } from '@gonasi/schemas/plugins';

import type { Route } from './+types/go-lesson-play';

import { CoursePlayLayout } from '~/components/layouts/course';
import { OutlineButton } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

const ViewPluginTypesRenderer = lazy(() => import('~/components/plugins/ViewPluginTypesRenderer'));

const nudgeAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: [0, -4, 0],
    transition: {
      opacity: { delay: 1, duration: 0.3, ease: 'easeOut' },
      y: {
        duration: 1.2,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut',
      },
    },
  },
};

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return {
    ...Object.fromEntries(loaderHeaders.entries()),
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  const { supabase } = createClient(request);

  const intent = formData.get('intent');
  const isLast = formData.get('isLast') === 'true';

  if (typeof intent !== 'string' || !(intent in interactionSchemaMap)) {
    return dataWithError(null, `Unknown intent: ${intent}`);
  }

  const typedIntent = intent as PluginTypeId;
  const schema = interactionSchemaMap[typedIntent];

  // Extract and parse the JSON payload string from formData
  const rawPayload = formData.get('payload');
  if (typeof rawPayload !== 'string') {
    return dataWithError(null, 'Missing or invalid payload');
  }

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(rawPayload);
  } catch {
    return dataWithError(null, 'Invalid JSON in payload');
  }

  // Validate the parsed payload directly against the schema
  const validationResult = schema.safeParse(parsedPayload);

  if (!validationResult.success) {
    return dataWithError(null, 'Invalid payload data', { status: 400 });
  }

  try {
    const { courseId, chapterId, lessonId } = params;

    // Use the validated data
    const { success, message } = await createBlockInteraction(supabase, {
      ...validationResult.data,
    });

    if (!success) {
      return dataWithError(null, message, { status: 400 });
    }

    if (isLast) {
      return redirect(`/go/course/${courseId}/${chapterId}/${lessonId}/play/completed`);
    }
    return true;
  } catch (error) {
    console.error(`Error processing intent "${intent}":`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return dataWithError(null, errorMessage, { status: 500 });
  }
}

export type GoLessonPlayInteractionReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data']['blockInteractions'];

export type GoLessonPlayLessonType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data']['lesson'];

export type GoLessonPlayLessonBlocksType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data']['lesson']['blocks'];

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const noCache = url.searchParams.get('noCache');

  const { supabase } = createClient(request);

  const [lesson, blockInteractions] = await Promise.all([
    fetchValidatedPublishedLessonById(supabase, params.lessonId),
    fetchUserLessonBlockInteractions({
      supabase,
      lessonId: params.lessonId,
    }),
  ]);

  const nextChapterAndLessonId = fetchNextChapterAndLessonId(
    supabase,
    params.courseId,
    params.chapterId,
    params.lessonId,
  );

  const lessonCompletionStatus = fetchLessonCompletionStatus(supabase, params.lessonId);

  if (!lesson) {
    return redirectWithError(`/go/courses/${params.courseId}`, 'Lesson not found');
  }

  const headers = noCache
    ? { 'Cache-Control': 'no-store' }
    : { 'Cache-Control': 's-maxage=10, stale-while-revalidate=59' };

  return data(
    { lesson, blockInteractions, nextChapterAndLessonId, lessonCompletionStatus },
    { headers },
  );
}

export default function GoLessonPlay({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const { visibleBlocks, initializePlayFlow, lessonProgress, activeBlock } = useStore();

  const blockRefs = useRef<Record<string, HTMLElement | null>>({});

  const {
    lesson: { blocks },
    blockInteractions,
    lessonCompletionStatus,
    nextChapterAndLessonId,
  } = loaderData;

  useEffect(() => {
    // Initialize the play flow when component mounts
    initializePlayFlow(blocks, blockInteractions);

    // Clean up when component unmounts
    return () => {
      useStore.getState().resetPlayFlow();
    };
  }, [blockInteractions, blocks, initializePlayFlow]);

  useEffect(() => {
    if (activeBlock) {
      blockRefs.current[activeBlock]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [activeBlock]);

  if (!visibleBlocks) return null;

  return (
    <>
      <CoursePlayLayout
        to={`/go/courses/${params.courseId}`}
        basePath={`/go/course/${params.courseId}/${params.chapterId}/${params.lessonId}/play`}
        progress={lessonProgress}
        loading={false}
      >
        <section className='mx-auto min-h-screen max-w-xl px-4 py-10 md:px-0'>
          {visibleBlocks?.length > 0
            ? visibleBlocks.map((block) => (
                <div
                  key={block.id}
                  ref={(el) => {
                    blockRefs.current[block.id] = el;
                  }}
                  className='scroll-mt-18 md:scroll-mt-22'
                >
                  <ViewPluginTypesRenderer block={block} mode='play' />
                </div>
              ))
            : null}

          <Suspense fallback={<LoaderCircle className='animate-spin' />}>
            <Await
              resolve={lessonCompletionStatus}
              errorElement={<div>Could not load reviews 😬</div>}
            >
              {(status) => (
                <>
                  {status?.is_complete ? (
                    <div className='fixed bottom-10'>
                      <motion.div initial={nudgeAnimation.initial} animate={nudgeAnimation.animate}>
                        <Suspense fallback={<LoaderCircle className='animate-spin' />}>
                          <Await
                            resolve={nextChapterAndLessonId}
                            errorElement={<div>Could not load next chapter and lesson</div>}
                          >
                            {(resolved) => (
                              <OutlineButton
                                type='button'
                                className='bg-card/80 rounded-full'
                                onClick={() =>
                                  navigate(
                                    `/go/course/${params.courseId}/${resolved?.nextChapterId}/${resolved?.nextLessonId}/play`,
                                  )
                                }
                                rightIcon={<ArrowRight />}
                              >
                                {resolved?.nextChapterId === params.chapterId
                                  ? 'Next lesson'
                                  : 'Next chapter'}
                              </OutlineButton>
                            )}
                          </Await>
                        </Suspense>
                      </motion.div>
                    </div>
                  ) : null}
                </>
              )}
            </Await>
          </Suspense>
        </section>
      </CoursePlayLayout>
      <Outlet />
    </>
  );
}

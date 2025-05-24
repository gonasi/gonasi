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
import {
  BaseInteractionSchema,
  type BaseInteractionSchemaType,
  getInteractionSchema,
  interactionSchemaMap,
  type PluginTypeId,
} from '@gonasi/schemas/plugins';

import type { Route } from './+types/go-lesson-play';

import { CoursePlayLayout } from '~/components/layouts/course';
import { OutlineButton } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

// Lazy-loads the plugin renderer component for performance
const ViewPluginTypesRenderer = lazy(() => import('~/components/plugins/ViewPluginTypesRenderer'));

// Framer Motion animation for nudge effect on the call-to-action button
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

/**
 * Handles POST requests for submitting interactions during a lesson.
 * Validates payload, stores data in DB, redirects to completion page if needed.
 */
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const { supabase } = createClient(request);

  const intentValue = formData.get('intent');
  const isLastInteraction = formData.get('isLast') === 'true';

  if (typeof intentValue !== 'string' || !(intentValue in interactionSchemaMap)) {
    return dataWithError(null, `Unknown interaction type: ${intentValue}`);
  }

  const interactionType = intentValue as PluginTypeId;
  const payloadValue = formData.get('payload');

  if (typeof payloadValue !== 'string') {
    return dataWithError(null, 'Missing or invalid payload data');
  }

  let interactionPayload: BaseInteractionSchemaType;
  try {
    interactionPayload = JSON.parse(payloadValue);
  } catch (parseError) {
    console.error('Error parsing interactionPayload: ', parseError);
    return dataWithError(null, 'Invalid JSON format in payload');
  }

  // Validate against base interaction schema
  const baseSchemaValidation = BaseInteractionSchema.safeParse(interactionPayload);
  if (!baseSchemaValidation.success) {
    return dataWithError(null, 'Payload does not match required structure', { status: 400 });
  }

  // Validate the interaction-specific state
  const InteractionSpecificSchema = getInteractionSchema(interactionType);
  const stateSchemaValidation = InteractionSpecificSchema.safeParse(interactionPayload.state);
  if (!stateSchemaValidation.success) {
    return dataWithError(null, 'Interaction state data is invalid', { status: 400 });
  }

  try {
    const { courseId, chapterId, lessonId } = params;

    console.log('data: ', baseSchemaValidation.data);

    const { success: recordSuccess, message: recordMessage } = await createBlockInteraction(
      supabase,
      baseSchemaValidation.data,
    );

    if (!recordSuccess) {
      return dataWithError(null, recordMessage, { status: 400 });
    }

    if (isLastInteraction) {
      return redirect(`/go/course/${courseId}/${chapterId}/${lessonId}/play/completed`);
    }

    return { success: true };
  } catch (unexpectedError) {
    console.error(`Failed to process "${interactionType}" interaction:`, unexpectedError);
    const errorMessage =
      unexpectedError instanceof Error
        ? unexpectedError.message
        : 'An unexpected error occurred while processing the interaction';
    return dataWithError(null, errorMessage, { status: 500 });
  }
}

// Extracted types for better reuse and clarity
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

/**
 * Loads lesson data and user interactions, plus next lesson and completion status.
 */
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [lesson, blockInteractions] = await Promise.all([
    fetchValidatedPublishedLessonById(supabase, params.lessonId),
    fetchUserLessonBlockInteractions({ supabase, lessonId: params.lessonId }),
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

  const transformedBlockInteractions = blockInteractions.map(({ blocks, ...rest }) => ({
    ...rest,
    plugin_type: blocks.plugin_type,
  }));

  return data({
    lesson,
    blockInteractions: transformedBlockInteractions,
    nextChapterAndLessonId,
    lessonCompletionStatus,
  });
}

/**
 * Main lesson play component. Renders lesson blocks and next lesson button if completed.
 */
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

  // Initialize and cleanup on mount/unmount
  useEffect(() => {
    initializePlayFlow(blocks, blockInteractions);
    return () => {
      useStore.getState().resetPlayFlow();
    };
  }, [blockInteractions, blocks, initializePlayFlow]);

  // Scroll to active block when it changes
  useEffect(() => {
    if (activeBlock) {
      blockRefs.current[activeBlock]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          {visibleBlocks.length > 0 &&
            visibleBlocks.map((block) => (
              <div
                key={block.id}
                ref={(el) => (blockRefs.current[block.id] = el)}
                className='scroll-mt-18 md:scroll-mt-22'
              >
                <ViewPluginTypesRenderer block={block} mode='play' />
              </div>
            ))}

          <Suspense fallback={<LoaderCircle className='animate-spin' />}>
            <Await
              resolve={lessonCompletionStatus}
              errorElement={<div>Could not load reviews 😬</div>}
            >
              {(status) =>
                status?.is_complete ? (
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
                ) : null
              }
            </Await>
          </Suspense>
        </section>
      </CoursePlayLayout>
      <Outlet />
    </>
  );
}

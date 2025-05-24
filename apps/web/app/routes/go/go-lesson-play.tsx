import { lazy, Suspense, useEffect, useRef } from 'react';
import { Await, data, Outlet, redirect, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { dataWithError, redirectWithError } from 'remix-toast';

// Database operations
import { fetchNextChapterAndLessonId } from '@gonasi/database/courses';
import {
  createBlockInteraction,
  fetchLessonCompletionStatus,
  fetchUserLessonBlockInteractions,
  fetchValidatedPublishedLessonById,
} from '@gonasi/database/lessons';
// Schema validation
import {
  BaseInteractionSchema,
  type BaseInteractionSchemaType,
  getInteractionSchema,
  interactionSchemaMap,
  type PluginTypeId,
} from '@gonasi/schemas/plugins';

// Component types
import type { Route } from './+types/go-lesson-play';

// UI components
import { CoursePlayLayout } from '~/components/layouts/course';
import { OutlineButton } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

// Lazy load the plugin renderer for better performance
const ViewPluginTypesRenderer = lazy(() => import('~/components/plugins/ViewPluginTypesRenderer'));

// Animation configuration for the "next lesson" button nudge effect
const nudgeAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: [0, -4, 0], // Creates a subtle bounce effect
    transition: {
      opacity: { delay: 1, duration: 0.3, ease: 'easeOut' },
      y: {
        duration: 1.2,
        repeat: Infinity,
        repeatType: 'loop' as const,
        ease: 'easeInOut',
      },
    },
  },
};

/**
 * Server action handler for processing educational content interactions.
 *
 * This function handles form submissions when students interact with lesson blocks
 * (e.g., answering questions, completing activities). It validates the interaction
 * data, saves it to the database, and manages lesson completion flow.
 *
 * @param request - The HTTP request containing form data
 * @param params - Route parameters (courseId, chapterId, lessonId)
 * @returns Success response or error with appropriate status code
 */
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const { supabase } = createClient(request);

  // Extract and validate the interaction type
  const intentValue = formData.get('intent');
  const isLastInteraction = formData.get('isLast') === 'true';

  if (typeof intentValue !== 'string' || !(intentValue in interactionSchemaMap)) {
    return dataWithError(null, `Unknown interaction type: ${intentValue}`);
  }

  const interactionType = intentValue as PluginTypeId;

  // Extract and validate the interaction payload
  const payloadValue = formData.get('payload');
  if (typeof payloadValue !== 'string') {
    return dataWithError(null, 'Missing or invalid payload data');
  }

  // Parse and validate the JSON payload
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

  // Validate interaction-specific state data
  const InteractionSpecificSchema = getInteractionSchema(interactionType);
  const stateSchemaValidation = InteractionSpecificSchema.safeParse(interactionPayload.state);
  if (!stateSchemaValidation.success) {
    return dataWithError(null, 'Interaction state data is invalid', { status: 400 });
  }

  try {
    const { courseId, chapterId, lessonId } = params;

    // Save the validated interaction to the database
    const { success: recordSuccess, message: recordMessage } = await createBlockInteraction(
      supabase,
      baseSchemaValidation.data,
    );

    if (!recordSuccess) {
      return dataWithError(null, recordMessage, { status: 400 });
    }

    // If this was the last interaction in the lesson, redirect to completion page
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

// Type definitions extracted from loader return type
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
 * Server loader function that fetches all necessary data for the lesson player.
 *
 * This function runs on the server and fetches:
 * - The lesson content and blocks
 * - User's previous interactions with lesson blocks
 * - Next chapter/lesson information for navigation
 * - Lesson completion status
 *
 * @param params - Route parameters
 * @param request - HTTP request for authentication
 * @returns Lesson data and related information
 */
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // Fetch lesson and user interactions in parallel for better performance
  const [lesson, blockInteractions] = await Promise.all([
    fetchValidatedPublishedLessonById(supabase, params.lessonId),
    fetchUserLessonBlockInteractions({
      supabase,
      lessonId: params.lessonId,
    }),
  ]);

  // These can be resolved asynchronously on the client
  const nextChapterAndLessonId = fetchNextChapterAndLessonId(
    supabase,
    params.courseId,
    params.chapterId,
    params.lessonId,
  );

  const lessonCompletionStatus = fetchLessonCompletionStatus(supabase, params.lessonId);

  // Redirect if lesson doesn't exist
  if (!lesson) {
    return redirectWithError(`/go/courses/${params.courseId}`, 'Lesson not found');
  }

  // Transform block interactions to include plugin type information
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
 * Main lesson player component.
 *
 * This component renders an interactive lesson player that:
 * - Displays lesson blocks (text, questions, activities, etc.)
 * - Manages user progress through the lesson
 * - Handles smooth scrolling between blocks
 * - Shows navigation to next lesson when complete
 *
 * @param loaderData - Data fetched by the loader function
 * @param params - Route parameters
 */
export default function GoLessonPlay({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();

  // Global state management for lesson progress and block visibility
  const { visibleBlocks, initializePlayFlow, lessonProgress, activeBlock } = useStore();

  // Refs to track DOM elements for each block (used for smooth scrolling)
  const blockRefs = useRef<Record<string, HTMLElement | null>>({});

  const {
    lesson: { blocks },
    blockInteractions,
    lessonCompletionStatus,
    nextChapterAndLessonId,
  } = loaderData;

  /**
   * Initialize the lesson play flow when component mounts.
   * This sets up which blocks should be visible based on user progress.
   */
  useEffect(() => {
    initializePlayFlow(blocks, blockInteractions);

    // Cleanup when component unmounts
    return () => {
      useStore.getState().resetPlayFlow();
    };
  }, [blockInteractions, blocks, initializePlayFlow]);

  /**
   * Handle smooth scrolling to the active block when it changes.
   * This ensures users can see the current block they're working on.
   */
  useEffect(() => {
    if (activeBlock) {
      blockRefs.current[activeBlock]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [activeBlock]);

  // Don't render anything until blocks are loaded
  if (!visibleBlocks) return null;

  return (
    <>
      {/* Course layout wrapper with progress bar and navigation */}
      <CoursePlayLayout
        to={`/go/courses/${params.courseId}`}
        basePath={`/go/course/${params.courseId}/${params.chapterId}/${params.lessonId}/play`}
        progress={lessonProgress}
        loading={false}
      >
        {/* Main lesson content area */}
        <section className='mx-auto min-h-screen max-w-xl px-4 py-10 md:px-0'>
          {/* Render visible lesson blocks */}
          {visibleBlocks?.length > 0 &&
            visibleBlocks.map((block) => (
              <div
                key={block.id}
                ref={(el) => {
                  blockRefs.current[block.id] = el;
                }}
                className='scroll-mt-18 md:scroll-mt-22' // Offset for fixed header
              >
                <Suspense fallback={<LoaderCircle className='animate-spin' />}>
                  <ViewPluginTypesRenderer block={block} mode='play' />
                </Suspense>
              </div>
            ))}

          {/* Lesson completion and next lesson navigation */}
          <Suspense fallback={<LoaderCircle className='animate-spin' />}>
            <Await
              resolve={lessonCompletionStatus}
              errorElement={<div>Could not load completion status 😬</div>}
            >
              {(status) => (
                <>
                  {status?.is_complete && (
                    <div className='fixed bottom-10'>
                      {/* Animated "next lesson" button */}
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
                  )}
                </>
              )}
            </Await>
          </Suspense>
        </section>
      </CoursePlayLayout>

      {/* Outlet for nested routes (e.g., completion page) */}
      <Outlet />
    </>
  );
}

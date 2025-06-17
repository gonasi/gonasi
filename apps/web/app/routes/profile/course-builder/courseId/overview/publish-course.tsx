// routes/publish-course/publish-course.tsx
import { useEffect } from 'react';
import { Form, Link } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { RefreshCw } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { redirectWithError } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { fetchCourseChaptersByCourseId } from '@gonasi/database/courseChapters';
import { fetchCourseOverviewById, fetchCoursePricing } from '@gonasi/database/courses';
import { fetchLessonBlocksByLessonId } from '@gonasi/database/lessons';
import { PublishCourseSchema, type PublishCourseSchemaTypes } from '@gonasi/schemas/publish';

import type { Route } from './+types/publish-course';
import { useAsyncValidation } from './publish/useAsyncValidation';
import { useValidationFields } from './publish/useValidationFields';
// Import our reusable components and hooks
import { ValidationSection } from './publish/ValidationSection';

import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Publish Course - Gonasi' },
    {
      name: 'description',
      content:
        'Validate your course content and publish it on Gonasi. Ensure your course meets all requirements before going live.',
    },
  ];
}

const resolver = zodResolver(PublishCourseSchema);

export type LoaderReturnType = Exclude<Awaited<ReturnType<typeof loader>>, Response>;

export type CoursePricingLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['pricingData'];

export type CourseChaptersLessonsLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['courseChapters'];

export type LessonBlocksLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['lessonsWithBlocks'];

type PricingType = CoursePricingLoaderReturnType[number];

type CourseChaptersType = CourseChaptersLessonsLoaderReturnType[number];

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const courseId = params.courseId ?? '';

  const [courseOverview, pricingData, courseChapters] = await Promise.all([
    fetchCourseOverviewById(supabase, courseId),
    fetchCoursePricing({ supabase, courseId }),
    fetchCourseChaptersByCourseId(supabase, courseId),
  ]);

  const redirectPath = `/${params.username}/course-builder/${params.courseId}/overview`;

  if (!courseOverview) return redirectWithError(redirectPath, 'Could not load course overview');
  if (!pricingData) return redirectWithError(redirectPath, 'Could not load pricing data');
  if (!courseChapters)
    return redirectWithError(redirectPath, 'Could not load chapters and lessons');

  // Updated to use flatMap - flattens all lessons from all chapters into a single array
  const lessonsWithBlocks = await Promise.all(
    courseChapters.flatMap((chapter) =>
      chapter.lessons.map(async (lesson) => {
        const { data: blocks } = await fetchLessonBlocksByLessonId(supabase, lesson.id);
        return { ...lesson, blocks };
      }),
    ),
  );

  return {
    courseOverview,
    pricingData,
    courseChapters,
    lessonsWithBlocks,
  };
}

export default function PublishCourse({ loaderData, params }: Route.ComponentProps) {
  const {
    courseOverview,
    pricingData,
    courseChapters: publishCourseChapters,
    lessonsWithBlocks,
  } = loaderData;
  const isPending = useIsPending();

  const rootRoute = `/${params.username}/course-builder/${params.courseId}`;
  const closeRoute = `${rootRoute}/overview`;

  const methods = useRemixForm<PublishCourseSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      courseOverview: {
        id: courseOverview.id,
        name: courseOverview.name,
        description: courseOverview.description ?? '',
        image_url: courseOverview.image_url ?? '',
        blur_hash: courseOverview.blur_hash ?? null,
        course_categories: courseOverview.course_categories ?? null,
        course_sub_categories: courseOverview.course_sub_categories ?? null,
        pathways: courseOverview.pathways ?? null,
      },
      pricingData:
        pricingData?.map((p: PricingType) => ({
          id: p.id,
          course_id: p.course_id,
          payment_frequency: p.payment_frequency,
          is_free: p.is_free,
          price: p.price,
          currency_code: p.currency_code,
          promotional_price: p.promotional_price ?? null,
          promotion_start_date: p.promotion_start_date ?? null,
          promotion_end_date: p.promotion_end_date ?? null,
          tier_name: p.tier_name ?? null,
          tier_description: p.tier_description ?? null,
          is_active: p.is_active,
          position: p.position,
          is_popular: p.is_popular,
          is_recommended: p.is_recommended,
        })) ?? [],
      courseChapters:
        publishCourseChapters?.map((chapter: CourseChaptersType) => ({
          lesson_count: chapter.lessons?.length ?? 0,
          id: chapter.id,
          course_id: chapter.course_id,
          name: chapter.name,
          description: chapter.description ?? '',
          position: chapter.position ?? 0,
          requires_payment: chapter.requires_payment,
          lessons:
            chapter.lessons?.map((lesson) => ({
              id: lesson.id,
              course_id: lesson.course_id,
              chapter_id: lesson.chapter_id,
              lesson_type_id: lesson.lesson_type_id,
              name: lesson.name,
              position: lesson.position,
              settings: lesson.settings,
              lesson_types: lesson.lesson_types,
            })) ?? [],
        })) ?? [],
      // Updated to match flattened structure - single array of lessons
      lessonsWithBlocks:
        lessonsWithBlocks?.map((lesson) => ({
          id: lesson.id,
          course_id: lesson.course_id,
          chapter_id: lesson.chapter_id,
          lesson_type_id: lesson.lesson_type_id,
          name: lesson.name,
          position: lesson.position,
          settings: lesson.settings,
          lesson_types: lesson.lesson_types,
          blocks:
            lesson.blocks?.map((block) => ({
              plugin_type: block.plugin_type,
              id: block.id,
              content: block.content,
              settings: block.settings,
              position: block.position,
              lesson_id: block.lesson_id,
              updated_by: block.updated_by,
            })) ?? null,
        })) ?? [],
    },
  });

  // Use our custom hooks
  const { courseOverviewFields, pricingFields, courseChaptersFields, lessonsWithBlocksFields } =
    useValidationFields({
      rootRoute,
      pricingData,
      courseChapters: publishCourseChapters,
      lessonsWithBlocks,
    });

  const { createValidator, isLoading } = useAsyncValidation<PublishCourseSchemaTypes>({
    trigger: methods.trigger,
  });

  // Create validators using the factory function
  const validateCourseOverview = createValidator('courseOverview', ['courseOverview']);
  const validatePricingData = createValidator('pricingData', ['pricingData']);
  const validateCourseChapters = createValidator('courseChapters', ['courseChapters']);
  const validateLessonsWithBlocks = createValidator('lessonsWithBlocks', ['lessonsWithBlocks']);

  const runInitialValidation = async () => {
    try {
      console.log('Running initial validation...');
      await Promise.all([
        validateCourseOverview(),
        validatePricingData(),
        validateCourseChapters(),
        validateLessonsWithBlocks(),
      ]);
      console.log('Initial validation completed');
    } catch (error) {
      console.error('Error during initial validation:', error);
    } finally {
    }
  };

  // Run validation on mount
  useEffect(() => {
    runInitialValidation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  const isDisabled = isPending || methods.formState.isSubmitting;

  console.log('Errors: ', methods.formState.errors.lessonsWithBlocks);

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title={`Publish Course - ${courseOverview.name}`}
          settingsPopover={
            <Link to={`${closeRoute}/publish`} reloadDocument>
              <RefreshCw size={18} />
            </Link>
          }
          closeRoute={closeRoute}
        />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              <ValidationSection
                title='Pricing'
                fields={pricingFields}
                hasErrors={!!methods.formState.errors.pricingData}
                isLoading={isLoading('pricingData')}
              />

              <ValidationSection
                title='Overview'
                fields={courseOverviewFields}
                hasErrors={!!methods.formState.errors.courseOverview}
                isLoading={isLoading('courseOverview')}
              />

              <ValidationSection
                title='Chapters'
                fields={courseChaptersFields}
                hasErrors={!!methods.formState.errors.courseChapters}
                isLoading={isLoading('courseChapters')}
              />

              <ValidationSection
                title='Lessons & Blocks'
                fields={lessonsWithBlocksFields}
                hasErrors={!!methods.formState.errors.lessonsWithBlocks}
                isLoading={isLoading('lessonsWithBlocks')}
              />

              <div className='mt-6'>
                <Button type='submit' disabled={isDisabled}>
                  Publish Course
                </Button>
              </div>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

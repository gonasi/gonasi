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

  const lessonsWithBlocks = await Promise.all(
    courseChapters.map(async (chapter) => {
      const lessonsWithBlocks = await Promise.all(
        chapter.lessons.map(async (lesson) => {
          const { data: blocks } = await fetchLessonBlocksByLessonId(supabase, lesson.id);
          return { ...lesson, blocks };
        }),
      );
      return lessonsWithBlocks;
    }),
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

  console.log('pricing data: ', pricingData);

  const rootRoute = `/${params.username}/course-builder/${params.courseId}`;
  const closeRoute = `${rootRoute}/overview`;

  const methods = useRemixForm<PublishCourseSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      courseOverview: {
        id: courseOverview.id,
        name: courseOverview.name,
        description: courseOverview.description ?? undefined,
        image_url: courseOverview.image_url ?? undefined,
        course_categories: courseOverview.course_categories ?? undefined,
        course_sub_categories: courseOverview.course_sub_categories ?? undefined,
        pathways: courseOverview.pathways ?? undefined,
      },
      pricingData:
        pricingData?.map((p: PricingType) => ({
          id: p.id,
          courseId: p.course_id,
          paymentFrequency: p.payment_frequency,
          isFree: p.is_free,
          price: p.price,
          currencyCode: p.currency_code,
          promotionalPrice: p.promotional_price ?? null,
          promotionStartDate: p.promotion_start_date ?? null,
          promotionEndDate: p.promotion_end_date ?? null,
          tierName: p.tier_name ?? null,
          tierDescription: p.tier_description ?? null,
          isActive: p.is_active,
          position: p.position,
          isPopular: p.is_popular,
          isRecommended: p.is_recommended,
        })) ?? [],
      courseChapters:
        publishCourseChapters?.map((chapter: CourseChaptersType) => ({
          lesson_count: chapter.lessons?.length ?? 0,
          id: chapter.id,
          course_id: chapter.course_id,
          name: chapter.name,
          description: chapter.description ?? null,
          created_at: chapter.created_at,
          updated_at: chapter.updated_at,
          created_by: chapter.created_by,
          position: chapter.position ?? null,
          requires_payment: chapter.requires_payment,
          lessons: chapter.lessons ?? [],
        })) ?? [],
    },
  });

  // Use our custom hooks
  const { courseOverviewFields, pricingFields, courseChapters, lessonsWithBlocks } =
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
  const validateLessons = createValidator('lessonsWithBlocks', ['lessonsWithBlocks']);

  const runInitialValidation = async () => {
    try {
      console.log('Running initial validation...');
      await Promise.all([
        validateCourseOverview(),
        validatePricingData(),
        validateLessons(),
        validateCourseChapters(),
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
                fields={courseChapters}
                hasErrors={!!methods.formState.errors.courseChapters}
                isLoading={isLoading('courseChapters')}
              />

              <ValidationSection
                title='Lessons & Blocks'
                fields={lessonsWithBlocks}
                hasErrors={!!methods.formState.errors.lessonsWithBlocks}
                isLoading={isLoading('lessonsWithBlocks')}
              />

              <div className='mt-6'>
                <Button type='submit' disabled={isDisabled}>
                  Save
                </Button>
              </div>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

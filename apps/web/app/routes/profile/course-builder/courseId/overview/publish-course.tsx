// routes/publish-course/publish-course.tsx
import { Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
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

export type CoursePricingLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['pricingData'];

type PricingType = CoursePricingLoaderReturnType[number];

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

  const chaptersWithBlocks = await Promise.all(
    courseChapters.map(async (chapter) => {
      const lessonsWithBlocks = await Promise.all(
        chapter.lessons.map(async (lesson) => {
          const { data: blocks } = await fetchLessonBlocksByLessonId(supabase, lesson.id);
          return { ...lesson, blocks };
        }),
      );
      return { ...chapter, lessons: lessonsWithBlocks };
    }),
  );

  return {
    courseOverview,
    pricingData,
    courseChapters: chaptersWithBlocks,
  };
}

export default function PublishCourse({ loaderData, params }: Route.ComponentProps) {
  const { courseOverview, pricingData } = loaderData;
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
        imageUrl: courseOverview.image_url ?? undefined,
        courseCategory: courseOverview.course_categories ?? undefined,
        courseSubCategory: courseOverview.course_sub_categories ?? undefined,
        pathways: courseOverview.pathways ?? undefined,
      },
      pricing:
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
    },
  });

  // Use our custom hooks
  const { courseOverviewFields, pricingFields } = useValidationFields({
    rootRoute,
    pricingData,
  });

  const { createValidator, isLoading } = useAsyncValidation<PublishCourseSchemaTypes>({
    trigger: methods.trigger,
  });

  // Create validators using the factory function
  const validateCourseOverview = createValidator('courseOverview', ['courseOverview']);
  const validatePricing = createValidator('pricing', ['pricing']);

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header title={`Publish Course - ${courseOverview.name}`} closeRoute={closeRoute} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              <ValidationSection
                title='Pricing'
                fields={pricingFields}
                hasErrors={!!methods.formState.errors.pricing}
                onValidate={validatePricing}
                isLoading={isLoading('pricing')}
              />

              <ValidationSection
                title='Overview'
                fields={courseOverviewFields}
                hasErrors={!!methods.formState.errors.courseOverview}
                onValidate={validateCourseOverview}
                isLoading={isLoading('courseOverview')}
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

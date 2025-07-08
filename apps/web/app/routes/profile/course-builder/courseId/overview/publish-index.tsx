import { useEffect, useMemo } from 'react';
import { Form, Link } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { RefreshCw } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { fetchCourseChaptersByCourseId } from '@gonasi/database/courseChapters';
import { fetchOrganizationCourseOverviewById, fetchCoursePricing } from '@gonasi/database/courses';
import { fetchLessonBlocksByLessonId } from '@gonasi/database/lessons';
import { upsertPublishCourse } from '@gonasi/database/publishedCourses';
import { PublishCourseSchema, type PublishCourseSchemaTypes } from '@gonasi/schemas/publish';

import type { Route } from './+types/publish-index';
import { getErrorFieldPathsBySection } from './publish/getErrorFieldPathsBySection';
import { useAsyncValidation } from './publish/useAsyncValidation';
import { useCourseChaptersFields } from './publish/validation/useCourseChaptersFields';
import { useCourseOverviewFields } from './publish/validation/useCourseOverviewFields';
import { useLessonsWithBlocksFields } from './publish/validation/useLessonsWithBlocksFields';
import { usePricingFields } from './publish/validation/usePricingFields';
import { ValidationSection } from './publish/ValidationSection';

// Import our reusable components and hooks
import { Button, NavLinkButton } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
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

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  // Initialize Supabase and headers for redirect
  const { supabase } = createClient(request);

  // Validate and parse form data with Zod
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<PublishCourseSchemaTypes>(formData, resolver);

  // Return validation errors, if any
  if (errors) {
    return { errors, defaultValues };
  }

  const { success, message } = await upsertPublishCourse(supabase, {
    ...data,
  });

  return success
    ? redirectWithSuccess(`/${params.username}/course-builder/${params.courseId}/overview`, message)
    : dataWithError(null, message);
}

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

type LessonType = LessonBlocksLoaderReturnType[number];

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const courseId = params.courseId ?? '';

  const [courseOverview, pricingData, courseChapters] = await Promise.all([
    fetchOrganizationCourseOverviewById(supabase, courseId),
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

  // Optimize default values to reduce memory usage for large datasets
  const optimizedDefaultValues = useMemo(
    () => ({
      courseOverview: {
        id: courseOverview.id,
        name: courseOverview.name,
        description: courseOverview.description ?? '',
        image_url: courseOverview.image_url ?? '',
        blur_hash: courseOverview.blur_hash ?? null,
        course_categories: courseOverview.course_categories ?? undefined,
        course_sub_categories: courseOverview.course_sub_categories ?? undefined,
        pathways: courseOverview.pathways ?? undefined,
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
      // Optimize lessons with blocks - only include essential data
      lessonsWithBlocks:
        lessonsWithBlocks?.map((lesson: LessonType) => ({
          id: lesson.id,
          course_id: lesson.course_id,
          chapter_id: lesson.chapter_id,
          lesson_type_id: lesson.lesson_type_id,
          name: lesson.name,
          position: lesson.position,
          settings: lesson.settings,
          lesson_types: lesson.lesson_types,
          // Only include block count and essential block data to reduce memory usage
          blocks:
            lesson.blocks?.map((block) => ({
              plugin_type: block.plugin_type,
              id: block.id,
              content: block.content, // Consider limiting content size for validation
              settings: block.settings,
              position: block.position,
              lesson_id: block.lesson_id,
              updated_by: block.updated_by,
            })) ?? null,
        })) ?? [],
    }),
    [courseOverview, pricingData, publishCourseChapters, lessonsWithBlocks],
  );

  const methods = useRemixForm<PublishCourseSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: optimizedDefaultValues,
  });

  const validationErrors = getErrorFieldPathsBySection(methods.formState.errors);

  const { fields: courseOverviewFields } = useCourseOverviewFields({
    rootRoute,
    validationErrors: validationErrors?.courseOverview,
  });

  const { fields: pricingFields } = usePricingFields({
    rootRoute,
    pricingData,
    validationErrors: validationErrors?.pricingData,
  });

  const { fields: courseChaptersFields } = useCourseChaptersFields({
    rootRoute,
    courseChapters: publishCourseChapters,
    validationErrors: validationErrors?.courseChapters,
  });

  const { fields: lessonsWithBlocksFields } = useLessonsWithBlocksFields({
    rootRoute,
    lessonsWithBlocks,
    validationErrors: validationErrors?.lessonsWithBlocks,
  });

  const { createSequentialValidator, getValidationState, isAnyLoading } =
    useAsyncValidation<PublishCourseSchemaTypes>({
      trigger: methods.trigger,
    });

  // Create sequential validation that processes validations one by one
  const runSequentialValidation = createSequentialValidator([
    { key: 'courseOverview', fields: ['courseOverview'] },
    { key: 'pricingData', fields: ['pricingData'] },
    { key: 'courseChapters', fields: ['courseChapters'] },
    { key: 'lessonsWithBlocks', fields: ['lessonsWithBlocks'] },
  ]);

  // Run validation on mount - now sequential
  useEffect(() => {
    console.log('Starting sequential validation...');
    runSequentialValidation()
      .then(() => {
        console.log('Sequential validation completed');
      })
      .catch((error) => {
        console.error('Error during sequential validation:', error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  const isDisabled = isPending || methods.formState.isSubmitting || isAnyLoading();

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
                title='Overview'
                fields={courseOverviewFields}
                validationState={getValidationState('courseOverview')}
              />

              <ValidationSection
                title='Pricing'
                fields={pricingFields}
                validationState={getValidationState('pricingData')}
              />

              <ValidationSection
                title='Chapters'
                fields={courseChaptersFields}
                validationState={getValidationState('courseChapters')}
              />

              <ValidationSection
                title='Lessons & Blocks'
                fields={lessonsWithBlocksFields}
                validationState={getValidationState('lessonsWithBlocks')}
              />

              <div className='my-6'>
                <div className='flex w-full items-center justify-between space-x-4'>
                  <NavLinkButton
                    to={closeRoute}
                    className='w-full'
                    variant='ghost'
                    disabled={isDisabled}
                  >
                    Cancel
                  </NavLinkButton>
                  <Button
                    type='submit'
                    className='w-full'
                    disabled={isDisabled || !methods.formState.isValid}
                  >
                    {isAnyLoading() ? 'Validating...' : 'Publish Course'}
                  </Button>
                </div>
              </div>

              {!isAnyLoading() && !methods.formState.isValid ? (
                <p className='font-secondary text-muted-foreground w-full pt-4 text-center text-sm'>
                  Almost there! Just fix a few things and you’ll be good to go 🚀
                </p>
              ) : null}
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

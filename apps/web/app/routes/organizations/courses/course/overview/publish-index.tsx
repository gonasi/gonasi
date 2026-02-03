import { Suspense, useState } from 'react';
import { Await, Link, useFetcher, useLoaderData } from 'react-router';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { dataWithError, redirectWithSuccess } from 'remix-toast';

import {
  type ChaptersValidationResult,
  type CourseValidationResult,
  fetchAndValidateChapters,
  fetchAndValidateCourseOverview,
  fetchAndValidateLessons,
  fetchAndValidatePricing,
  type LessonsValidationResult,
} from '@gonasi/database/courses';
import { upsertPublishCourse } from '@gonasi/database/publishedCourses';

import type { Route } from './+types/publish-index';
import { ValidationMessages } from './publish/components/ValidationMessages';
import { ValidationPending } from './publish/components/ValidationPending';

import { BannerCard } from '~/components/cards';
import { Button, NavLinkButton } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [
    { title: 'Publish Course • Gonasi' },
    {
      name: 'description',
      content: 'Prepare and publish your course to share it with learners on Gonasi.',
    },
  ];
}

export async function action({ request, params }: Route.ActionArgs) {
  // Initialize Supabase and headers for redirect
  const { supabase } = createClient(request);

  const { success, message } = await upsertPublishCourse({
    supabase,
    organizationId: params.organizationId,
    courseId: params.courseId,
  });

  // Get redirectTo from URL
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get('redirectTo');
  const fallbackPath = `/${params.organizationId}/courses/${params.courseId}/published`;

  return success
    ? redirectWithSuccess(redirectTo ?? fallbackPath, message)
    : dataWithError(null, message);
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const courseId = params.courseId ?? '';
  const organizationId = params.organizationId ?? '';

  const canEditResult = await supabase.rpc('can_user_edit_course', {
    arg_course_id: params.courseId,
  });

  const courseOverview = fetchAndValidateCourseOverview({ supabase, courseId, organizationId });
  const chapterOverview = fetchAndValidateChapters({ supabase, courseId, organizationId });
  const lessonOverview = fetchAndValidateLessons({ supabase, courseId, organizationId });
  const pricingOverview = fetchAndValidatePricing({ supabase, courseId, organizationId });

  return {
    canEdit: Boolean(canEditResult.data),
    pricingOverview,
    courseOverview,
    chapterOverview,
    lessonOverview,
  };
}

export default function NewPublishIndex({ params, loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();

  const { canEdit } = loaderData;

  const { pricingOverview, courseOverview, chapterOverview, lessonOverview } = useLoaderData() as {
    pricingOverview: Promise<CourseValidationResult>;
    courseOverview: Promise<CourseValidationResult>;
    chapterOverview: Promise<ChaptersValidationResult>;
    lessonOverview: Promise<LessonsValidationResult>;
  };

  const rootRoute = `/${params.organizationId}/courses/${params.courseId}`;
  const closeRoute = `${rootRoute}/overview`;

  const [results, setResults] = useState<{
    pricing?: CourseValidationResult;
    course?: CourseValidationResult;
    chapters?: ChaptersValidationResult;
    lessons?: LessonsValidationResult;
  }>({});

  if (!canEdit) {
    return (
      <Modal open>
        <Modal.Content size='md'>
          <Modal.Header title='Publish Course' closeRoute={closeRoute} />
          <Modal.Body className='flex flex-col space-y-2'>
            <BannerCard
              showCloseIcon={false}
              variant='restricted'
              message='Publishing This Course'
              description={`You don't have permission to publish or unpublish this course. Please contact an administrator for access.`}
              className='mt-4 md:mt-0'
            />
          </Modal.Body>
        </Modal.Content>
      </Modal>
    );
  }

  const isAnyLoading = () =>
    !results.pricing || !results.course || !results.chapters || !results.lessons;

  const hasAnyError = () =>
    results.pricing?.errors?.length ||
    results.course?.errors?.length ||
    results.chapters?.errors?.length ||
    results.lessons?.errors?.length;

  const handlePublish = () => {
    const formData = new FormData();

    fetcher.submit(formData, {
      method: 'post',
    });
  };

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title='Publish Course'
          settingsPopover={
            <Link to={`${closeRoute}/publish`} reloadDocument>
              <RefreshCw size={18} />
            </Link>
          }
          closeRoute={closeRoute}
        />
        <Modal.Body className='flex flex-col space-y-2'>
          <Suspense fallback={<ValidationPending title='Pricing' success={false} isLoading />}>
            <Await resolve={pricingOverview}>
              {(data) => {
                setResults((prev) => ({ ...prev, pricing: data }));
                return (
                  <ValidationMessages
                    errors={data.errors ?? []}
                    title='Pricing'
                    completionStatus={data.completionStatus}
                  />
                );
              }}
            </Await>
          </Suspense>
          <Suspense
            fallback={<ValidationPending title='Course Overview' success={false} isLoading />}
          >
            <Await resolve={courseOverview}>
              {(data) => {
                setResults((prev) => ({ ...prev, course: data }));
                return (
                  <ValidationMessages
                    errors={data.errors ?? []}
                    title='Course Overview'
                    completionStatus={data.completionStatus}
                  />
                );
              }}
            </Await>
          </Suspense>
          <Suspense fallback={<ValidationPending title='Chapters' success={false} isLoading />}>
            <Await resolve={chapterOverview}>
              {(data) => {
                setResults((prev) => ({ ...prev, chapters: data }));
                return (
                  <ValidationMessages
                    errors={data.errors ?? []}
                    title='Chapters'
                    completionStatus={data.completionStatus}
                  />
                );
              }}
            </Await>
          </Suspense>
          <Suspense fallback={<ValidationPending title='Lessons' success={false} isLoading />}>
            <Await resolve={lessonOverview}>
              {(data) => {
                setResults((prev) => ({ ...prev, lessons: data }));
                return (
                  <ValidationMessages
                    errors={data.errors ?? []}
                    title='Lessons'
                    completionStatus={data.completionStatus}
                  />
                );
              }}
            </Await>
          </Suspense>
          <div className='bg-warning/80 text-warning-foreground flex items-start gap-2 p-4'>
            <AlertTriangle className='text-warning-foreground mt-0.5 h-5 w-5' />
            <p className='text-sm leading-relaxed'>
              <span className='font-secondary font-semibold'>Warning:</span> Publishing this course
              will <span className='font-semibold'>reset all user progress</span>. This action is{' '}
              <span className='italic'>irreversible</span>.
            </p>
          </div>
          <div className='my-6'>
            <div className='flex w-full items-center justify-between space-x-4'>
              <NavLinkButton
                to={closeRoute}
                className='w-full'
                variant='ghost'
                disabled={isAnyLoading()}
              >
                Cancel
              </NavLinkButton>
              <Button
                type='submit'
                className='w-full'
                disabled={fetcher.state !== 'idle' || isAnyLoading() || !!hasAnyError()}
                onClick={isAnyLoading() ? undefined : () => handlePublish()}
                isLoading={fetcher.state !== 'idle'}
              >
                {isAnyLoading() ? 'Validating...' : 'Publish Course'}
              </Button>
            </div>
          </div>
          {!isAnyLoading() && !!hasAnyError() && (
            <p className='font-secondary text-muted-foreground w-full pt-4 text-center text-sm'>
              Almost there! Just fix a few things and you’ll be good to go 🚀
            </p>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

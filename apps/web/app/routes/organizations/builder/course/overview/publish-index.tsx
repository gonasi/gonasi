import { Suspense, useState } from 'react';
import { Await, Link, useFetcher, useLoaderData } from 'react-router';
import { RefreshCw } from 'lucide-react';
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

  return success
    ? redirectWithSuccess(`/${params.organizationId}/builder/${params.courseId}/published`, message)
    : dataWithError(null, message);
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const courseId = params.courseId ?? '';
  const organizationId = params.organizationId ?? '';

  const courseOverview = fetchAndValidateCourseOverview({ supabase, courseId, organizationId });
  const chapterOverview = fetchAndValidateChapters({ supabase, courseId, organizationId });
  const lessonOverview = fetchAndValidateLessons({ supabase, courseId, organizationId });
  const pricingOverview = fetchAndValidatePricing({ supabase, courseId, organizationId });

  return {
    pricingOverview,
    courseOverview,
    chapterOverview,
    lessonOverview,
  };
}

export default function NewPublishIndex({ params }: Route.ComponentProps) {
  const fetcher = useFetcher();

  const { pricingOverview, courseOverview, chapterOverview, lessonOverview } = useLoaderData() as {
    pricingOverview: Promise<CourseValidationResult>;
    courseOverview: Promise<CourseValidationResult>;
    chapterOverview: Promise<ChaptersValidationResult>;
    lessonOverview: Promise<LessonsValidationResult>;
  };

  const rootRoute = `/${params.organizationId}/builder/${params.courseId}`;
  const closeRoute = `${rootRoute}/overview`;

  const [results, setResults] = useState<{
    pricing?: CourseValidationResult;
    course?: CourseValidationResult;
    chapters?: ChaptersValidationResult;
    lessons?: LessonsValidationResult;
  }>({});

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

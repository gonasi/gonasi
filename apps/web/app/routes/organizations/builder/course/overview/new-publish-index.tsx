import { Suspense } from 'react';
import { Await, Link, useLoaderData } from 'react-router';
import { RefreshCw } from 'lucide-react';

import {
  type ChaptersValidationResult,
  type CourseValidationResult,
  fetchAndValidateChapters,
  fetchAndValidateCourseOverview,
  fetchAndValidateLessons,
  fetchAndValidatePricing,
  type LessonsValidationResult,
} from '@gonasi/database/courses';

import type { Route } from './+types/new-publish-index';
import { ValidationMessages } from './publish/components/ValidationMessages';
import { ValidationPending } from './publish/components/ValidationPending';

import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

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
  const { pricingOverview } = useLoaderData() as {
    pricingOverview: Promise<CourseValidationResult>;
  };
  const { courseOverview } = useLoaderData() as { courseOverview: Promise<CourseValidationResult> };
  const { chapterOverview } = useLoaderData() as {
    chapterOverview: Promise<ChaptersValidationResult>;
  };
  const { lessonOverview } = useLoaderData() as {
    lessonOverview: Promise<LessonsValidationResult>;
  };

  const rootRoute = `/${params.organizationId}/builder/${params.courseId}`;
  const closeRoute = `${rootRoute}/overview`;

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
                return (
                  <div>
                    <ValidationMessages
                      errors={data.errors ?? []}
                      title='Pricing'
                      completionStatus={data.completionStatus}
                    />
                  </div>
                );
              }}
            </Await>
          </Suspense>
          <Suspense
            fallback={<ValidationPending title='Course Overview' success={false} isLoading />}
          >
            <Await resolve={courseOverview}>
              {(data) => {
                return (
                  <div>
                    <ValidationMessages
                      errors={data.errors ?? []}
                      title='Course Overview'
                      completionStatus={data.completionStatus}
                    />
                  </div>
                );
              }}
            </Await>
          </Suspense>
          <Suspense fallback={<ValidationPending title='Chapters' success={false} isLoading />}>
            <Await resolve={chapterOverview}>
              {(data) => {
                return (
                  <div>
                    {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}

                    <ValidationMessages
                      errors={data.errors ?? []}
                      title='Chapters'
                      completionStatus={data.completionStatus}
                    />
                  </div>
                );
              }}
            </Await>
          </Suspense>
          <Suspense fallback={<ValidationPending title='Lessons' success={false} isLoading />}>
            <Await resolve={lessonOverview}>
              {(data) => {
                return (
                  <div>
                    {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}
                    <ValidationMessages
                      errors={data.errors ?? []}
                      title='Lessons'
                      completionStatus={data.completionStatus}
                    />
                  </div>
                );
              }}
            </Await>
          </Suspense>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

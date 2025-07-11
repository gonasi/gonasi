import { Suspense, useCallback, useMemo, useState } from 'react';
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

import { Button, NavLinkButton } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

// Types
interface ValidationResults {
  pricing?: CourseValidationResult;
  course?: CourseValidationResult;
  chapters?: ChaptersValidationResult;
  lessons?: LessonsValidationResult;
}

interface ValidationSection {
  key: keyof ValidationResults;
  title: string;
  promise: Promise<CourseValidationResult | ChaptersValidationResult | LessonsValidationResult>;
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const courseId = params.courseId ?? '';
  const organizationId = params.organizationId ?? '';

  // Fetch all validations in parallel
  const [courseOverview, chapterOverview, lessonOverview, pricingOverview] =
    await Promise.allSettled([
      fetchAndValidateCourseOverview({ supabase, courseId, organizationId }),
      fetchAndValidateChapters({ supabase, courseId, organizationId }),
      fetchAndValidateLessons({ supabase, courseId, organizationId }),
      fetchAndValidatePricing({ supabase, courseId, organizationId }),
    ]);

  return {
    pricingOverview:
      pricingOverview.status === 'fulfilled'
        ? Promise.resolve(pricingOverview.value)
        : Promise.reject(pricingOverview.reason),
    courseOverview:
      courseOverview.status === 'fulfilled'
        ? Promise.resolve(courseOverview.value)
        : Promise.reject(courseOverview.reason),
    chapterOverview:
      chapterOverview.status === 'fulfilled'
        ? Promise.resolve(chapterOverview.value)
        : Promise.reject(chapterOverview.reason),
    lessonOverview:
      lessonOverview.status === 'fulfilled'
        ? Promise.resolve(lessonOverview.value)
        : Promise.reject(lessonOverview.reason),
  };
}

export default function NewPublishIndex({ params }: Route.ComponentProps) {
  const { pricingOverview, courseOverview, chapterOverview, lessonOverview } = useLoaderData() as {
    pricingOverview: Promise<CourseValidationResult>;
    courseOverview: Promise<CourseValidationResult>;
    chapterOverview: Promise<ChaptersValidationResult>;
    lessonOverview: Promise<LessonsValidationResult>;
  };

  const [results, setResults] = useState<ValidationResults>({});

  // Memoize routes to prevent unnecessary re-renders
  const routes = useMemo(() => {
    const rootRoute = `/${params.organizationId}/builder/${params.courseId}`;
    return {
      root: rootRoute,
      close: `${rootRoute}/overview`,
      refresh: `${rootRoute}/overview/publish`,
    };
  }, [params.organizationId, params.courseId]);

  // Memoize validation sections configuration
  const validationSections = useMemo<ValidationSection[]>(
    () => [
      { key: 'pricing', title: 'Pricing', promise: pricingOverview },
      { key: 'course', title: 'Course Overview', promise: courseOverview },
      { key: 'chapters', title: 'Chapters', promise: chapterOverview },
      { key: 'lessons', title: 'Lessons', promise: lessonOverview },
    ],
    [pricingOverview, courseOverview, chapterOverview, lessonOverview],
  );

  // Memoize loading and error states
  const { isAnyLoading, hasAnyError } = useMemo(() => {
    const loadingStates = validationSections.map((section) => !results[section.key]);
    const errorStates = validationSections.map(
      (section) => results[section.key]?.errors?.length || 0,
    );

    return {
      isAnyLoading: loadingStates.some(Boolean),
      hasAnyError: errorStates.some((count) => count > 0),
    };
  }, [results, validationSections]);

  // Memoize result updater to prevent unnecessary re-renders
  const updateResults = useCallback(
    (key: keyof ValidationResults) => (data: ValidationResults[typeof key]) => {
      setResults((prev) => ({ ...prev, [key]: data }));
    },
    [],
  );

  // Render validation section with error boundary
  const renderValidationSection = useCallback(
    ({ key, title, promise }: ValidationSection) => (
      <Suspense key={key} fallback={<ValidationPending title={title} success={false} isLoading />}>
        <Await resolve={promise}>
          {(data) => {
            updateResults(key)(data);
            return (
              <ValidationMessages
                errors={data.errors ?? []}
                title={title}
                completionStatus={data.completionStatus}
              />
            );
          }}
        </Await>
      </Suspense>
    ),
    [updateResults],
  );

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title='Publish Course'
          settingsPopover={
            <Link to={routes.refresh} reloadDocument>
              <RefreshCw size={18} />
            </Link>
          }
          closeRoute={routes.close}
        />

        <Modal.Body className='flex flex-col space-y-2'>
          {validationSections.map(renderValidationSection)}

          <div className='my-6'>
            <div className='flex w-full items-center justify-between space-x-4'>
              <NavLinkButton
                to={routes.close}
                className='w-full'
                variant='ghost'
                disabled={isAnyLoading}
              >
                Cancel
              </NavLinkButton>
              <Button type='submit' className='w-full' disabled={isAnyLoading || hasAnyError}>
                {isAnyLoading ? 'Validating...' : 'Publish Course'}
              </Button>
            </div>
          </div>

          {!isAnyLoading && hasAnyError && (
            <p className='font-secondary text-muted-foreground w-full pt-4 text-center text-sm'>
              {`Almost there! Just fix a few things and you'll be good to go 🚀`}
            </p>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

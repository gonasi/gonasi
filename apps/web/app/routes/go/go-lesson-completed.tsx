import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { redirectWithError } from 'remix-toast';

import { fetchCoursePlayStatus } from '@gonasi/database/lessons/go';

import type { Route } from './+types/go-lesson-completed';

import { Spinner } from '~/components/loaders';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

// Lazy-load CompletionScreen
const CompletionScreen = lazy(() => import('~/components/completion-screen'));

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

export type CoursePlayStatusLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data'];

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const courseStatus = await fetchCoursePlayStatus(
    supabase,
    params.courseId,
    params.chapterId,
    params.lessonId,
  );

  if (!courseStatus.success) {
    return redirectWithError(`/go/courses/${params.courseId}`, courseStatus.message);
  }

  return courseStatus;
}

export default function GoLessonPlay({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const handleClose = () => navigate(`/go/courses/${params.courseId}`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='md'>
        <Modal.Body className='p-0'>
          <Suspense
            fallback={
              <div className='p-4 text-center'>
                <Spinner />
              </div>
            }
          >
            <CompletionScreen data={loaderData.data} courseId={params.courseId} />
          </Suspense>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

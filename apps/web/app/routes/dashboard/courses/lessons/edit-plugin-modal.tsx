import { Suspense } from 'react';
import { useNavigate } from 'react-router';
import { redirectWithError } from 'remix-toast';

import { fetchSingleBlockByBlockId } from '@gonasi/database/lessons';

import type { Route } from './+types/edit-plugin-modal';

import { Spinner } from '~/components/loaders';
import { EditPluginTypesRenderer } from '~/components/plugins/editPluginTypesRenderer';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

export type LessonBlockLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data'];

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const lessonBlock = await fetchSingleBlockByBlockId(supabase, params.blockId);

  if (!lessonBlock.data) {
    return redirectWithError(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}/edit-content`,
      'Lesson block not found',
    );
  }

  return lessonBlock;
}

export default function EditPlugisModal({ loaderData, params }: Route.ComponentProps) {
  const block = loaderData.data;

  const navigate = useNavigate();

  const handleClose = () => {
    navigate(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}/edit-content`,
    );
  };

  return (
    <Modal open onOpenChange={(open) => !open && handleClose()}>
      <Modal.Content size='md'>
        <Modal.Header title='Edit Plugin' />
        <Modal.Body>
          <Suspense fallback={<Spinner />}>
            <EditPluginTypesRenderer block={block} />
          </Suspense>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

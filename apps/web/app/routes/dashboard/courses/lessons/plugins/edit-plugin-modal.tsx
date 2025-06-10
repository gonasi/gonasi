import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { Pencil } from 'lucide-react';
import { redirectWithError } from 'remix-toast';

import { fetchSingleBlockByBlockId } from '@gonasi/database/lessons';

import type { Route } from './+types/edit-plugin-modal';

import { Spinner } from '~/components/loaders';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

const LazyEditPluginTypesRenderer = lazy(
  () => import('~/components/plugins/PluginRenderers/EditPluginTypesRenderer'),
);

export type LessonBlockLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data'];

// --- Loader ---
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const lessonBlock = await fetchSingleBlockByBlockId(supabase, params.blockId);

  if (!lessonBlock.data) {
    const redirectPath = `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}`;
    return redirectWithError(redirectPath, 'Lesson block not found');
  }

  return lessonBlock;
}

// --- Component ---
export default function EditPluginsModal({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const block = loaderData.data;

  const handleClose = () => {
    navigate(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}`,
    );
  };

  return (
    <Modal open onOpenChange={(open) => !open && handleClose()}>
      <Modal.Content size='md'>
        <Modal.Header leadingIcon={<Pencil size={14} />} title='Edit' />
        <Modal.Body>
          <Suspense fallback={<Spinner />}>
            <LazyEditPluginTypesRenderer block={block} />
          </Suspense>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

import { lazy, Suspense, useMemo } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { ArrowLeft, LoaderCircle } from 'lucide-react';

import {
  getPluginTypeNameById,
  type PluginGroupId,
  type PluginTypeId,
} from '@gonasi/schemas/plugins';

import type { Route } from './+types/create-block-by-plugin-id-modal';

import { Spinner } from '~/components/loaders';
import { Modal } from '~/components/ui/modal';

const LazyGonasiPluginGroup = lazy(() => import('~/components/plugins/GonasiPluginGroup'));

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=3600, stale-while-revalidate=3600',
  };
}

export default function CreateBlockByPluginIdModal({ params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}`,
    );
  };

  // Use useMemo to prevent unnecessary recalculations
  const plugin = useMemo(
    () =>
      getPluginTypeNameById(params.pluginGroupId as PluginGroupId, params.pluginId as PluginTypeId),
    [params.pluginGroupId, params.pluginId],
  );

  const BackButton = () => (
    <NavLink
      to={`/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}/plugins/${params.pluginGroupId}`}
    >
      {({ isPending }) => (isPending ? <LoaderCircle className='animate-spin' /> : <ArrowLeft />)}
    </NavLink>
  );

  // Determine modal title once
  const modalTitle = plugin || 'Plugin not found';

  return (
    <>
      <Modal open onOpenChange={(open) => !open && handleClose()}>
        <Modal.Content size='md'>
          <Modal.Header leadingIcon={<BackButton />} title={modalTitle} />
          <Modal.Body>
            <Suspense fallback={<Spinner />}>
              {plugin ? <p>Lazy load create component here</p> : <h1>Plugin not found</h1>}
            </Suspense>
          </Modal.Body>
        </Modal.Content>
      </Modal>
      <Outlet />
    </>
  );
}

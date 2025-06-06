import { lazy, Suspense, useMemo } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { ArrowLeft, LoaderCircle } from 'lucide-react';

import { getPluginTypesFromGroupId, type PluginGroupId } from '@gonasi/schemas/plugins';

import type { Route } from './+types/view-plugins-by-plugin-group-id-modal';

import { Spinner } from '~/components/loaders';
import { Modal } from '~/components/ui/modal';

const LazyGonasiPluginGroup = lazy(() => import('~/components/plugins/GonasiPluginGroup'));

export default function PluginsModal({ params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}`,
    );
  };

  // Use useMemo to prevent unnecessary recalculations
  const pluginGroup = useMemo(
    () => getPluginTypesFromGroupId(params.pluginGroupId as PluginGroupId),
    [params.pluginGroupId],
  );

  const BackButton = () => (
    <NavLink
      to={`/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}/plugins`}
    >
      {({ isPending }) => (isPending ? <LoaderCircle className='animate-spin' /> : <ArrowLeft />)}
    </NavLink>
  );

  // Determine modal title once
  const modalTitle = pluginGroup ? pluginGroup.name : 'Plugin not found';

  return (
    <>
      <Modal open onOpenChange={(open) => !open && handleClose()}>
        <Modal.Content size='lg'>
          <Modal.Header leadingIcon={<BackButton />} title={modalTitle} />
          <Modal.Body>
            <Suspense fallback={<Spinner />}>
              {pluginGroup ? (
                <LazyGonasiPluginGroup pluginTypes={pluginGroup.pluginTypes} />
              ) : (
                <h1>Plugin not found</h1>
              )}
            </Suspense>
          </Modal.Body>
        </Modal.Content>
      </Modal>
      <Outlet />
    </>
  );
}

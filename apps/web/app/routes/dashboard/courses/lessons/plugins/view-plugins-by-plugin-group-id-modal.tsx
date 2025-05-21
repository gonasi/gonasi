import { lazy, Suspense } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { ArrowLeft, LoaderCircle } from 'lucide-react';

import { getPluginTypesFromGroupId, type PluginGroupId } from '@gonasi/schemas/plugins';

import type { Route } from './+types/view-plugins-by-plugin-group-id-modal';

import { Spinner } from '~/components/loaders';
import { Modal } from '~/components/ui/modal';

const LazyGonasiPluginGroup = lazy(() => import('~/components/plugins/GonasiPluginGroup'));

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=3600, stale-while-revalidate=3600',
  };
}

export default function PluginsModal({ params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}`,
    );
  };

  const pluginGroup = getPluginTypesFromGroupId(params.pluginGroupId as PluginGroupId);

  const BackButton = () => (
    <NavLink
      to={`/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}/plugins`}
    >
      {({ isPending }) => (isPending ? <LoaderCircle className='animate-spin' /> : <ArrowLeft />)}
    </NavLink>
  );

  const ModalContent = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Modal open onOpenChange={(open) => !open && handleClose()}>
      <Modal.Content size='md'>
        <Modal.Header leadingIcon={<BackButton />} title={title} />
        <Modal.Body>
          <Suspense fallback={<Spinner />}>{children}</Suspense>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );

  if (!pluginGroup) {
    return (
      <ModalContent title='Plugin not found'>
        <h1>Plugin not found</h1>
      </ModalContent>
    );
  }

  return (
    <>
      <ModalContent title={pluginGroup.name}>
        <LazyGonasiPluginGroup pluginTypes={pluginGroup.pluginTypes} />
      </ModalContent>
      <Outlet />
    </>
  );
}

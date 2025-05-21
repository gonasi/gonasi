import { lazy, Suspense } from 'react';
import { Outlet, useNavigate } from 'react-router';

import type { Route } from './+types/view-all-plugins-modal';

import { AppLogo } from '~/components/app-logo';
import { Spinner } from '~/components/loaders';
import { Modal } from '~/components/ui/modal';

// Lazy load the dialog component
const AllGonasiPlugins = lazy(() => import('~/components/plugins/AllGonasiPlugins'));

export default function PluginsModal({ params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}`,
    );
  };

  return (
    <>
      <Modal open onOpenChange={(open) => !open && handleClose()}>
        <Modal.Content size='lg'>
          <Modal.Header
            leadingIcon={<AppLogo sizeClass='h-4 md:h-5 -mt-1' />}
            title='All Gonasi Plugins'
          />
          <Modal.Body>
            <Suspense fallback={<Spinner />}>
              <AllGonasiPlugins />
            </Suspense>
          </Modal.Body>
        </Modal.Content>
      </Modal>
      <Outlet />
    </>
  );
}

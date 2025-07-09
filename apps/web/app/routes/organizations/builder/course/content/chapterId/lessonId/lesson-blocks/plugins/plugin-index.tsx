import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router';

import type { Route } from './+types/plugin-index';

import { AppLogo } from '~/components/app-logo';
import { Spinner } from '~/components/loaders';
import { Modal } from '~/components/ui/modal';

// Lazy load the dialog component
const AllGonasiPlugins = lazy(() => import('~/components/plugins/AllGonasiPlugins'));

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=3600, stale-while-revalidate=3600',
  };
}

export default function PluginsModal({ params }: Route.ComponentProps) {
  const basePath = `/${params.username}/course-builder/${params.courseId}/content`;
  const lessonBasePath = `${basePath}/${params.chapterId}/${params.lessonId}/lesson-blocks`;

  return (
    <>
      <Modal open>
        <Modal.Content size='lg'>
          <Modal.Header
            leadingIcon={<AppLogo sizeClass='h-4 md:h-5 -mt-1' />}
            title='All Gonasi Plugins'
            closeRoute={lessonBasePath}
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

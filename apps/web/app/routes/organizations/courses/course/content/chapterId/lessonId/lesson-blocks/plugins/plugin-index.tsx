import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router';
import { redirectWithError } from 'remix-toast';

import type { Route } from './+types/plugin-index';

import { AppLogo } from '~/components/app-logo';
import { Spinner } from '~/components/loaders';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

// Lazy load the dialog component
const AllGonasiPlugins = lazy(() => import('~/components/plugins/AllGonasiPlugins'));

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=3600, stale-while-revalidate=3600',
  };
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const canEdit = await supabase.rpc('can_user_edit_course', {
    arg_course_id: params.courseId,
  });

  if (!canEdit.data) {
    return redirectWithError(
      `/${params.organizationId}/courses/${params.courseId}/content/${params.chapterId}/${params.lessonId}/lesson-blocks`,
      'You don’t have permission to add blocks.',
    );
  }

  return true;
}

export default function PluginsModal({ params }: Route.ComponentProps) {
  const basePath = `/${params.organizationId}/courses/${params.courseId}/content`;
  const lessonBasePath = `${basePath}/${params.chapterId}/${params.lessonId}/lesson-blocks`;

  return (
    <>
      <Modal open>
        <Modal.Content size='lg'>
          <Modal.Header
            leadingIcon={<AppLogo sizeClass='h-4 md:h-5 -mt-0.5' />}
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

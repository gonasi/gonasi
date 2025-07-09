import { lazy, Suspense, useMemo } from 'react';
import { Outlet } from 'react-router';

import { getPluginTypesFromGroupId, type PluginGroupId } from '@gonasi/schemas/plugins';

import type { Route } from './+types/view-plugins-by-plugin-group-id-modal';

import { Spinner } from '~/components/loaders';
import { BackArrowNavLink } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';

const LazyGonasiPluginGroup = lazy(() => import('~/components/plugins/GonasiPluginGroup'));

export default function PluginsModal({ params }: Route.ComponentProps) {
  const basePath = `/${params.organizationId}/builder/${params.courseId}/content`;
  const lessonBasePath = `${basePath}/${params.chapterId}/${params.lessonId}/lesson-blocks`;

  // Use useMemo to prevent unnecessary recalculations
  const pluginGroup = useMemo(
    () => getPluginTypesFromGroupId(params.pluginGroupId as PluginGroupId),
    [params.pluginGroupId],
  );

  const BackButton = () => <BackArrowNavLink to={`${lessonBasePath}/plugins`} />;

  // Determine modal title once
  const modalTitle = pluginGroup ? pluginGroup.name : 'Plugin not found';

  return (
    <>
      <Modal open>
        <Modal.Content size='md'>
          <Modal.Header
            leadingIcon={<BackButton />}
            title={modalTitle}
            closeRoute={lessonBasePath}
          />
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

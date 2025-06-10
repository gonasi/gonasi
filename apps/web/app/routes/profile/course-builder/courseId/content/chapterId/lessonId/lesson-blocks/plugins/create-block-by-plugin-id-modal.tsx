import { lazy, Suspense, useMemo } from 'react';
import { Outlet } from 'react-router';

import {
  getPluginTypeNameById,
  type PluginGroupId,
  type PluginTypeId,
} from '@gonasi/schemas/plugins';

import type { Route } from './+types/create-block-by-plugin-id-modal';

import { Spinner } from '~/components/loaders';
import { BackArrowNavLink } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';

// Lazy-load the plugin block renderer for performance
const LazyCreatePluginBlockRenderer = lazy(
  () => import('~/components/plugins/PluginRenderers/BuilderPluginBlockRenderer'),
);

// Utility function to build base path for modal URLs
const getLessonPath = ({
  username,
  courseId,
  chapterId,
  lessonId,
}: Pick<Route.ComponentProps['params'], 'username' | 'courseId' | 'chapterId' | 'lessonId'>) =>
  `/${username}/course-builder/${courseId}/content/${chapterId}/${lessonId}/lesson-blocks`;

/**
 * Modal to create a plugin block by plugin type ID
 */
export default function CreateBlockByPluginIdModal({ params }: Route.ComponentProps) {
  const { username, courseId, chapterId, lessonId, pluginGroupId, pluginTypeId } = params;

  const lessonPath = getLessonPath({ username, courseId, chapterId, lessonId });
  const backRoute = `${lessonPath}/plugins/${pluginGroupId}`;

  // Resolve plugin name for title display
  const plugin = useMemo(
    () => getPluginTypeNameById(pluginGroupId as PluginGroupId, pluginTypeId as PluginTypeId),
    [pluginGroupId, pluginTypeId],
  );

  return (
    <>
      <Modal open>
        <Modal.Content size='md'>
          <Modal.Header
            leadingIcon={<BackArrowNavLink to={backRoute} />}
            title={plugin || 'Plugin not found'}
            closeRoute={lessonPath}
          />
          <Modal.Body>
            <Suspense fallback={<Spinner />}>
              {plugin ? (
                <LazyCreatePluginBlockRenderer pluginTypeId={pluginTypeId as PluginTypeId} />
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

import { lazy, Suspense, useMemo } from 'react';
import { Outlet } from 'react-router';

import {
  getPluginTypeNameById,
  type PluginGroupId,
  type PluginTypeId,
} from '@gonasi/schemas/plugins';

import type { Route } from './+types/create-block-by-plugin-id-modal';

import { Spinner } from '~/components/loaders';
import { Modal } from '~/components/ui/modal';

// Lazy-load the plugin block renderer for performance
const LazyCreatePluginBlockRenderer = lazy(
  () => import('~/components/plugins/PluginRenderers/BuilderPluginBlockRenderer'),
);

/**
 * Modal to create a plugin block by plugin type ID
 */
export default function CreateBlockByPluginIdModal({ params }: Route.ComponentProps) {
  const { pluginGroupId, pluginTypeId } = params;

  console.log('[CreateBlockByPluginIdModal] params:', { pluginGroupId, pluginTypeId });

  // Resolve plugin name for title display
  const plugin = useMemo(() => {
    const name = getPluginTypeNameById(
      pluginGroupId as PluginGroupId,
      pluginTypeId as PluginTypeId,
    );
    console.log('[CreateBlockByPluginIdModal] plugin name:', name);
    return name;
  }, [pluginGroupId, pluginTypeId]);

  return (
    <>
      <Modal open>
        <Suspense fallback={<Spinner />}>
          {plugin ? (
            <LazyCreatePluginBlockRenderer pluginTypeId={pluginTypeId as PluginTypeId} />
          ) : (
            <h1>Plugin not found</h1>
          )}
        </Suspense>
      </Modal>
      <Outlet />
    </>
  );
}

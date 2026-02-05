import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';

import type { Route } from './+types/create-session-block';

import {
  LiveSessionBlockFormWrapper,
  liveSessionPluginRegistry,
} from '~/components/plugins/liveSession';
import { Modal } from '~/components/ui/modal';

export default function CreateSessionBlock({ params }: Route.ComponentProps) {
  const { pluginTypeId } = params;
  const plugin = liveSessionPluginRegistry.get(pluginTypeId);

  const blocksPath = `/${params.organizationId}/live-sessions/${params.sessionId}/blocks`;
  const selectorPath = `${blocksPath}/all-session-blocks`;
  const actionUrl = `${blocksPath}/create-new/upsert`;

  if (!plugin) {
    return (
      <Modal open>
        <Modal.Content size='sm'>
          <Modal.Header title='New Live Session Block' closeRoute={blocksPath} />
          <Modal.Body>
            <p className='text-muted-foreground text-sm'>This plugin type is not yet supported.</p>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    );
  }

  return (
    <LiveSessionBlockFormWrapper
      plugin={plugin}
      liveSessionId={params.sessionId}
      organizationId={params.organizationId}
      actionUrl={actionUrl}
      closeRoute={selectorPath}
      modalCloseRoute={blocksPath}
      leadingIcon={
        <Link
          to={selectorPath}
          className='text-muted-foreground hover:text-foreground transition-colors'
        >
          <ArrowLeft size={20} />
        </Link>
      }
    />
  );
}

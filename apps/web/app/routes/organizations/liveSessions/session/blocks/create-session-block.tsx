import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';

import type { Route } from './+types/create-session-block';

import { Modal } from '~/components/ui/modal';

import { LiveSessionTrueOrFalseForm } from './LiveSessionTrueOrFalseForm';

const PLUGIN_TITLES: Record<string, string> = {
  true_or_false: 'New True or False Block',
};

export default function CreateSessionBlock({ params }: Route.ComponentProps) {
  const { pluginTypeId } = params;

  const blocksPath = `/${params.organizationId}/live-sessions/${params.sessionId}/blocks`;
  const newPath = `${blocksPath}/new`;
  const actionUrl = `${blocksPath}/create-new/upsert`;
  const title = PLUGIN_TITLES[pluginTypeId] ?? 'New Block';

  if (pluginTypeId === 'true_or_false') {
    return (
      <Modal open>
        <Modal.Content size='lg'>
          <Modal.Header
            title={title}
            closeRoute={blocksPath}
            leadingIcon={
              <Link to={newPath} className='text-muted-foreground hover:text-foreground transition-colors'>
                <ArrowLeft size={20} />
              </Link>
            }
          />
          <Modal.Body>
            <LiveSessionTrueOrFalseForm
              liveSessionId={params.sessionId}
              organizationId={params.organizationId}
              actionUrl={actionUrl}
              closeRoute={newPath}
            />
          </Modal.Body>
        </Modal.Content>
      </Modal>
    );
  }

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header title={title} closeRoute={blocksPath} />
        <Modal.Body>
          <p className='text-muted-foreground text-sm'>This plugin type is not yet supported.</p>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

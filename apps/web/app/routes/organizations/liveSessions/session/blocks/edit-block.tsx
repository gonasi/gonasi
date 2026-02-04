import { redirectWithError } from 'remix-toast';

import { fetchLiveSessionBlockById } from '@gonasi/database/liveSessions';

import type { Route } from './+types/edit-block';

import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

import { LiveSessionTrueOrFalseForm } from './LiveSessionTrueOrFalseForm';

export function meta() {
  return [{ title: 'Edit Block • Gonasi' }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const sessionId = params.sessionId ?? '';
  const blockId = params.blockId ?? '';

  const [block, canEditResult] = await Promise.all([
    fetchLiveSessionBlockById({ supabase, blockId }),
    supabase.rpc('can_user_edit_live_session', { arg_session_id: sessionId }),
  ]);

  if (!block || !canEditResult.data) {
    return redirectWithError(
      `/${params.organizationId}/live-sessions/${sessionId}/blocks`,
      !block ? 'Block not found.' : 'You do not have permission to edit blocks.',
    );
  }

  return { block };
}

export default function EditBlock({ params, loaderData }: Route.ComponentProps) {
  const { block } = loaderData;

  const blocksPath = `/${params.organizationId}/live-sessions/${params.sessionId}/blocks`;
  const actionUrl = `${blocksPath}/${params.blockId}/upsert`;

  if (block.plugin_type === 'true_or_false') {
    return (
      <Modal open>
        <Modal.Content size='lg'>
          <Modal.Header title='Edit True or False Block' closeRoute={blocksPath} />
          <Modal.Body>
            <LiveSessionTrueOrFalseForm
              block={block}
              liveSessionId={params.sessionId}
              organizationId={params.organizationId}
              actionUrl={actionUrl}
              closeRoute={blocksPath}
            />
          </Modal.Body>
        </Modal.Content>
      </Modal>
    );
  }

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header title='Edit Block' closeRoute={blocksPath} />
        <Modal.Body>
          <p className='text-muted-foreground text-sm'>This block type is not yet supported for editing.</p>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

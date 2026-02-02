import type { Route } from './+types/edit-block';

import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

// TODO: Implement metadata
export function meta() {
  return [{ title: 'Edit Block • Gonasi' }];
}

// TODO: Implement loader to fetch block
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // TODO: Fetch block by ID
  // TODO: Check user can edit session

  return { block: null };
}

// TODO: Implement block editor component
export default function EditBlock({ params, loaderData }: Route.ComponentProps) {
  const { block } = loaderData;

  // TODO: Reuse existing plugin editor components
  // TODO: Load appropriate editor based on plugin_type
  // TODO: Save to /blocks/:blockId/upsert endpoint
  // TODO: Handle time limits for the block
  // TODO: Handle scoring configuration

  return (
    <Modal open>
      <Modal.Content size='xl'>
        <Modal.Header
          title='Edit Question Block'
          closeRoute={`/${params.organizationId}/live-sessions/${params.sessionId}/blocks`}
        />
        <Modal.Body>
          {/* TODO: Render appropriate plugin editor */}
          <p>Block editor goes here...</p>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

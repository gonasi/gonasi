import type { Route } from './+types/new-block';

import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

// TODO: Implement metadata
export function meta() {
  return [{ title: 'Add Block • Gonasi' }];
}

// TODO: Implement loader to fetch available plugins
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // TODO: Check user can edit session
  // TODO: Return available quiz plugin types

  return { plugins: [] };
}

// TODO: Implement plugin selector component
export default function NewBlock({ params, loaderData }: Route.ComponentProps) {
  // TODO: Reuse existing plugin selector UI from lesson blocks
  // TODO: Display available quiz plugins:
  //   - multiple_choice_single
  //   - multiple_choice_multiple
  //   - true_or_false
  //   - fill_in_blank
  //   - matching_game
  //   - swipe_categorize
  // TODO: On selection, redirect to edit-block with plugin type

  return (
    <Modal open>
      <Modal.Content size='lg'>
        <Modal.Header
          title='Select Question Type'
          closeRoute={`/${params.organizationId}/live-sessions/${params.sessionId}/blocks`}
        />
        <Modal.Body>
          {/* TODO: Implement plugin selector grid */}
          <p>Plugin selector goes here...</p>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

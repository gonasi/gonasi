import { Form } from 'react-router';

import type { Route } from './+types/edit-settings';

import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { useIsPending } from '~/utils/misc';

// TODO: Implement metadata
export function meta() {
  return [{ title: 'Edit Session Settings • Gonasi' }];
}

// TODO: Implement loader to fetch session
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // TODO: Fetch session by ID
  // TODO: Check user can edit session

  return { session: null };
}

// TODO: Implement action to update session settings
export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createClient(request);
  const formData = await request.formData();

  // TODO: Validate form data
  // TODO: Update session configuration
  // TODO: Redirect back to overview

  return { success: true };
}

// TODO: Implement edit settings component
export default function EditSettings({ params, loaderData }: Route.ComponentProps) {
  const isSubmitting = useIsPending();

  // TODO: Form fields:
  // - max_participants
  // - allow_late_join (checkbox)
  // - show_leaderboard (checkbox)
  // - enable_chat (checkbox)
  // - enable_reactions (checkbox)
  // - time_limit_per_question

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title='Edit Session Settings'
          closeRoute={`/${params.organizationId}/live-sessions/${params.sessionId}/overview`}
        />
        <Modal.Body>
          <Form method='POST' className='space-y-4'>
            {/* TODO: Implement edit settings form */}
            <Button type='submit' disabled={isSubmitting} isLoading={isSubmitting}>
              Save Settings
            </Button>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

import { Form } from 'react-router';

import type { Route } from './+types/edit-details';

import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { useIsPending } from '~/utils/misc';

// TODO: Implement metadata
export function meta() {
  return [{ title: 'Edit Session Details • Gonasi' }];
}

// TODO: Implement loader to fetch session
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // TODO: Fetch session by ID
  // TODO: Check user can edit session

  return { session: null };
}

// TODO: Implement action to update session details
export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createClient(request);
  const formData = await request.formData();

  // TODO: Validate form data
  // TODO: Update session (name, description, scheduled_start_time)
  // TODO: Redirect back to overview

  return { success: true };
}

// TODO: Implement edit details component
export default function EditDetails({ params, loaderData }: Route.ComponentProps) {
  const isSubmitting = useIsPending();

  // TODO: Form fields:
  // - name
  // - description
  // - scheduled_start_time (optional)

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title='Edit Session Details'
          closeRoute={`/${params.organizationId}/live-sessions/${params.sessionId}/overview`}
        />
        <Modal.Body>
          <Form method='POST' className='space-y-4'>
            {/* TODO: Implement edit details form */}
            <Button type='submit' disabled={isSubmitting} isLoading={isSubmitting}>
              Save Changes
            </Button>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

import { Form } from 'react-router';

import type { Route } from './+types/add-facilitator';

import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { useIsPending } from '~/utils/misc';

// TODO: Implement metadata
export function meta() {
  return [{ title: 'Add Facilitator • Gonasi' }];
}

// TODO: Implement loader to fetch org members
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // TODO: Check user is admin/owner
  // TODO: Fetch org members (editors/staff)
  // TODO: Exclude already assigned facilitators

  return { availableMembers: [] };
}

// TODO: Implement action to add facilitator
export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createClient(request);
  const formData = await request.formData();

  // TODO: Validate user is admin/owner
  // TODO: Add to live_session_facilitators
  // TODO: Redirect back to facilitators list

  return { success: true };
}

// TODO: Implement add facilitator component
export default function AddFacilitator({ params, loaderData }: Route.ComponentProps) {
  const isSubmitting = useIsPending();

  // TODO: Select component for org members
  // TODO: Show member avatars and usernames
  // TODO: Add button

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title='Add Facilitator'
          closeRoute={`/${params.organizationId}/live-sessions/${params.sessionId}/facilitators`}
        />
        <Modal.Body>
          <Form method='POST' className='space-y-4'>
            {/* TODO: Implement member selector */}
            <Button type='submit' disabled={isSubmitting} isLoading={isSubmitting}>
              Add Facilitator
            </Button>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

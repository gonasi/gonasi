import { Form } from 'react-router';

import type { Route } from './+types/remove-facilitator';

import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { useIsPending } from '~/utils/misc';

// TODO: Implement metadata
export function meta() {
  return [{ title: 'Remove Facilitator • Gonasi' }];
}

// TODO: Implement loader to fetch facilitator
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // TODO: Check user is admin/owner
  // TODO: Fetch facilitator details

  return { facilitator: null };
}

// TODO: Implement action to remove facilitator
export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createClient(request);

  // TODO: Validate user is admin/owner
  // TODO: Remove from live_session_facilitators
  // TODO: Redirect back to facilitators list

  return { success: true };
}

// TODO: Implement remove confirmation component
export default function RemoveFacilitator({ params, loaderData }: Route.ComponentProps) {
  const isSubmitting = useIsPending();

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title='Remove Facilitator'
          closeRoute={`/${params.organizationId}/live-sessions/${params.sessionId}/facilitators`}
        />
        <Modal.Body>
          <p className='mb-4'>
            Are you sure you want to remove this facilitator? They will lose access to edit this
            session.
          </p>

          <Form method='POST' className='space-y-4'>
            <div className='flex gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => window.history.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                variant='destructive'
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                Remove Facilitator
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

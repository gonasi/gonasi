import { Form } from 'react-router';

import type { Route } from './+types/delete-session';

import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { useIsPending } from '~/utils/misc';

// TODO: Implement metadata
export function meta() {
  return [{ title: 'Delete Session • Gonasi' }];
}

// TODO: Implement loader to fetch session
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // TODO: Fetch session by ID
  // TODO: Check user is admin/owner (only they can delete)

  return { session: null };
}

// TODO: Implement action to delete session
export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createClient(request);

  // TODO: Check user is admin/owner
  // TODO: Delete session (CASCADE will handle related records)
  // TODO: Redirect to live-sessions list

  return { success: true };
}

// TODO: Implement delete confirmation component
export default function DeleteSession({ params, loaderData }: Route.ComponentProps) {
  const isSubmitting = useIsPending();

  // TODO: Show warning about deletion
  // TODO: List what will be deleted (blocks, participants, responses, etc.)
  // TODO: Confirmation button

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title='Delete Session'
          closeRoute={`/${params.organizationId}/live-sessions/${params.sessionId}/overview`}
        />
        <Modal.Body>
          <p className='mb-4 text-red-500'>
            Warning: This action cannot be undone. All session data, including blocks, participants, and responses,
            will be permanently deleted.
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
              <Button type='submit' variant='destructive' disabled={isSubmitting} isLoading={isSubmitting}>
                Delete Session
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

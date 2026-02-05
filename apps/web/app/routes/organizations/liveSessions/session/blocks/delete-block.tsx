import { Form, NavLink } from 'react-router';
import { redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { deleteLiveSessionBlock, fetchLiveSessionBlockById } from '@gonasi/database/liveSessions';

import type { Route } from './+types/delete-block';

import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const PLUGIN_TYPE_LABELS: Record<string, string> = {
  true_or_false: 'True or False',
  multiple_choice_single: 'Multiple Choice',
  multiple_choice_multiple: 'Multi-Select',
  fill_in_blank: 'Fill in the Blank',
  matching_game: 'Matching',
  swipe_categorize: 'Swipe & Sort',
};

export function meta() {
  return [{ title: 'Delete Block • Gonasi' }];
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
      !block ? 'Block not found.' : 'You do not have permission to delete blocks.',
    );
  }

  return { block };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const blocksPath = `/${params.organizationId}/live-sessions/${params.sessionId}/blocks`;

  const result = await deleteLiveSessionBlock({ supabase, blockId: params.blockId });

  return result.success
    ? redirectWithSuccess(blocksPath, result.message)
    : redirectWithError(blocksPath, result.message);
}

export default function DeleteBlock({ params, loaderData }: Route.ComponentProps) {
  const { block } = loaderData;
  const isSubmitting = useIsPending();
  const blocksPath = `/${params.organizationId}/live-sessions/${params.sessionId}/blocks`;
  const pluginLabel = PLUGIN_TYPE_LABELS[block.plugin_type] ?? block.plugin_type;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header title='Delete Block' closeRoute={blocksPath} />
        <Modal.Body>
          <p className='mb-4'>
            Are you sure you want to delete this <strong>{pluginLabel}</strong> block? This action
            cannot be undone.
          </p>

          <Form method='POST' className='space-y-4'>
            <HoneypotInputs />
            <div className='flex gap-2'>
              <NavLink to={blocksPath}>
                <Button type='button' variant='ghost' disabled={isSubmitting}>
                  Cancel
                </Button>
              </NavLink>
              <Button
                type='submit'
                variant='danger'
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                Delete Block
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

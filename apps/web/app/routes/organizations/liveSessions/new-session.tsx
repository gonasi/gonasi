import { Form } from 'react-router';
import { ChevronRight } from 'lucide-react';

import type { Route } from './+types/new-session';

import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { useIsPending } from '~/utils/misc';

// TODO: Implement metadata
export function meta() {
  return [
    { title: 'Create Live Session • Gonasi' },
    {
      name: 'description',
      content: 'Create a new live interactive session on Gonasi.',
    },
  ];
}

// TODO: Implement action to create session
export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createClient(request);
  const formData = await request.formData();

  // TODO: Validate form data with Zod schema
  // TODO: Generate session code automatically
  // TODO: Create session in DB
  // TODO: Auto-assign creator as facilitator if they're 'editor' role
  // TODO: Redirect to /:sessionId/overview

  return { success: true };
}

// TODO: Implement new session component
export default function NewSession({ params }: Route.ComponentProps) {
  const isSubmitting = useIsPending();

  // TODO: Form fields:
  // - name (required)
  // - description
  // - visibility (public/unlisted/private)
  // - session_key (required for private)
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
          title="Create Live Session 🎮"
          closeRoute={`/${params.organizationId}/live-sessions`}
        />
        <Modal.Body>
          <Form method='POST' className='space-y-4'>
            {/* TODO: Implement create session form */}
            <input
              type='text'
              name='name'
              placeholder='Session name'
              className='w-full rounded border p-2'
              disabled={isSubmitting}
            />

            <Button type='submit' disabled={isSubmitting} isLoading={isSubmitting} rightIcon={<ChevronRight />}>
              Create Session
            </Button>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

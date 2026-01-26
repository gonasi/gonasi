import { Form } from 'react-router';
import { LoaderCircle, X } from 'lucide-react';
import { dataWithError, redirectWithSuccess } from 'remix-toast';

import { revokeCourseInvite } from '@gonasi/database/courseInvites';

import type { Route } from './+types/revoke-invite';

import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Revoke Invite • Gonasi' },
    { name: 'description', content: 'Revoke course invitation' },
  ];
}

export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createClient(request);
  const { courseId, token } = params;

  if (!courseId || !token) {
    return dataWithError(null, 'Missing required parameters.');
  }

  const result = await revokeCourseInvite({
    supabase,
    data: {
      publishedCourseId: courseId,
      token,
    },
  });

  if (!result.success) {
    return dataWithError(null, result.message);
  }

  return redirectWithSuccess(
    `/${params.organizationId}/builder/${courseId}/learners/invites`,
    result.message,
  );
}

export default function RevokeInvite({ params }: Route.ComponentProps) {
  const isPending = useIsPending();

  const closeRoute = `/${params.organizationId}/builder/${params.courseId}/learners/invites`;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header title='Revoke Invite' closeRoute={closeRoute} />
        <Modal.Body className='px-4'>
          <p className='text-muted-foreground mb-4 text-sm'>
            Are you sure you want to revoke this course invitation? The recipient will no longer be
            able to use this invite link to enroll in the course.
          </p>
          <p className='text-muted-foreground mb-6 text-xs'>
            This action cannot be undone. You&apos;ll need to send a new invite if you change your
            mind.
          </p>
          <Form method='POST'>
            <div className='flex gap-2'>
              <Button
                type='submit'
                disabled={isPending}
                variant='danger'
                className='flex-1'
                rightIcon={isPending ? <LoaderCircle className='animate-spin' /> : <X />}
              >
                {isPending ? 'Revoking...' : 'Revoke Invite'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

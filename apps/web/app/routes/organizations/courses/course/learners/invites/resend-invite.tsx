import { Form } from 'react-router';
import { LoaderCircle, MailPlus } from 'lucide-react';
import { dataWithError, redirectWithSuccess } from 'remix-toast';

import { resendCourseInvite } from '@gonasi/database/courseInvites';

import type { Route } from './+types/resend-invite';

import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Resend Invite • Gonasi' },
    { name: 'description', content: 'Resend course invitation email' },
  ];
}

export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createClient(request);
  const { courseId, token } = params;

  if (!courseId || !token) {
    return dataWithError(null, 'Missing required parameters.');
  }

  const result = await resendCourseInvite({
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
    `/${params.organizationId}/courses/${courseId}/learners/invites`,
    result.message,
  );
}

export default function ResendInvite({ params }: Route.ComponentProps) {
  const isPending = useIsPending();

  const closeRoute = `/${params.organizationId}/courses/${params.courseId}/learners/invites`;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header title='Resend Invite' closeRoute={closeRoute} />
        <Modal.Body className='px-4'>
          <p className='text-muted-foreground font-secondary mb-4 text-sm'>
            Are you sure you want to resend this course invitation? The recipient will receive a new
            email with the invite link.
          </p>
          <p className='text-muted-foreground mb-6 text-xs'>
            Note: You can only resend an invite every 5 minutes.
          </p>
          <Form method='POST'>
            <div className='flex gap-2'>
              <Button
                type='submit'
                disabled={isPending}
                className='flex-1'
                rightIcon={isPending ? <LoaderCircle className='animate-spin' /> : <MailPlus />}
              >
                {isPending ? 'Resending...' : 'Resend Invite'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

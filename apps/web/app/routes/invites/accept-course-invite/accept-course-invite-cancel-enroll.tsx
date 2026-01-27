import { useOutletContext } from 'react-router';

import type { Route } from './+types/accept-course-invite-cancel-enroll';
import type { CourseInviteEnrollContextType } from './accept-course-invite-enroll';

import { Modal } from '~/components/ui/modal';

export default function AcceptCourseInviteCancelEnroll({ params }: Route.ComponentProps) {
  const { courseName, inviteToken } = useOutletContext<CourseInviteEnrollContextType>();

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          title='Enrollment Cancelled'
          closeRoute={`/i/course-invites/${inviteToken}/accept/enroll/${params.pricingTierId}`}
        />
        <Modal.Body className='text-muted-foreground space-y-2 px-4 py-4 text-sm'>
          <p>
            You've cancelled your enrollment to{' '}
            <span className='text-foreground font-medium'>{courseName}</span> via invitation.
          </p>
          <p className='font-secondary'>
            If this was a mistake, you can go back to complete your enrollment using this
            invitation.
          </p>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

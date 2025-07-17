import { useOutletContext } from 'react-router';

import type { Route } from './+types/cancel-enroll';
import type { CoursePricingContextType } from './enroll-index';

import { Modal } from '~/components/ui/modal';

export default function CancelEnrolment({ params }: Route.ComponentProps) {
  const { name } = useOutletContext<CoursePricingContextType>();

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          title='Enrollment Cancelled'
          closeRoute={`/c/${params.publishedCourseId}/enroll/${params.pricingTierId}`}
        />
        <Modal.Body className='text-muted-foreground space-y-2 px-4 py-4 text-sm'>
          <p>
            You’ve cancelled your enrollment to{' '}
            <span className='text-foreground font-medium'>{name}</span>.
          </p>
          <p className='font-secondary'>
            If this was a mistake, you can choose a tier again to re-enroll.
          </p>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

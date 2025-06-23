import type { Route } from './+types/enroll-index';

import { Modal } from '~/components/ui/modal';

export default function VerifyEnroll({ params }: Route.ComponentProps) {
  const courseId = params.publishedCourseId;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header title='Verify' closeRoute={`/c/${courseId}`} />
        <Modal.Body className='px-0 md:px-4'>
          <h1>Verify Enroll</h1>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

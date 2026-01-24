import type { Route } from './+types/cohorts-index';

import { Modal } from '~/components/ui/modal';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export default function CohortsIndex({ params }: Route.ComponentProps) {
  const closeRoute = `/${params.organizationId}/builder/${params.courseId}/file-library`;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header closeRoute={closeRoute} />
        <Modal.Body>
          <h2>hello</h2>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

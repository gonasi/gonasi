import { zodResolver } from '@hookform/resolvers/zod';

import { DeleteFileSchema } from '@gonasi/schemas/file';

import type { Route } from './+types/publish-course';

import { Modal } from '~/components/ui/modal';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}
const resolver = zodResolver(DeleteFileSchema);

export default function PublishCourse({ loaderData, params }: Route.ComponentProps) {
  const closeRoute = `/${params.username}/course-builder/${params.courseId}/overview`;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header closeRoute={closeRoute} />
        <Modal.Body>
          <h2>Publish course</h2>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

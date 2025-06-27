import type { Route } from './+types/update-profile-photo';

import { Modal } from '~/components/ui/modal';

export default function UpdateProfilePhoto({ params }: Route.ComponentProps) {
  const closeRoute = `/go/${params.username}/settings/profile-information`;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header title='Update Profile Photo' closeRoute={closeRoute} />
        <Modal.Body>
          <h2>hello</h2>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

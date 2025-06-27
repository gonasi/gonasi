import type { Route } from './+types/update-personal-information';

import { Modal } from '~/components/ui/modal';

export default function UpdatePersonalInformation({ params }: Route.ComponentProps) {
  const closeRoute = `/go/${params.username}/settings/profile-information`;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header title='Update Personal Information' closeRoute={closeRoute} />
        <Modal.Body>
          <h2>hello</h2>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

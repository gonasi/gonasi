import { Modal } from '~/components/ui/modal';

export default function NewOrganization() {
  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header title='New org' />
        <Modal.Body className='px-4'>
          <h2>new org</h2>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

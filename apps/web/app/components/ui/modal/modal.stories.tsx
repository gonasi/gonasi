import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../button';
import { Modal } from './modal';

type ModalProps = ComponentProps<typeof Modal>;

const meta = {
  title: 'ui/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: (args: ModalProps) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button>Show modal</Button>
      </Modal.Trigger>
      <Modal.Content>
        <Modal.Header title='share via email' />
        <Modal.Body>
          <p>Enter the email address to where you want to sent the file to.</p>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  ),
};

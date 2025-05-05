import { MemoryRouter } from 'react-router';
import type { Meta, StoryObj } from '@storybook/react';

import { Stepper } from './stepper';

const meta = {
  title: 'ui/Stepper',
  component: Stepper,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className='flex w-full max-w-lg flex-col items-center md:max-w-none'>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  argTypes: {
    currentStepIndex: {
      control: { type: 'number', min: 0, max: 2 },
      description: 'The index of the current active step',
    },
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof Stepper>;

const steps = [
  { id: '1', title: 'Step 1', path: '/step-1' },
  { id: '2', title: 'Step 2', path: '/step-2' },
  { id: '3', title: 'Step 3', path: '/step-3' },
];

export const Basic: Story = {
  args: {
    steps,
    className: 'w-full',
    currentStepIndex: 1, // Default to step 2 for better preview
  },
};

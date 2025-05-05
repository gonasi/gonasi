import type { Meta, StoryObj } from '@storybook/react';

import { Progress } from './progress';

const meta = {
  title: 'ui/Progress',
  component: Progress,
  argTypes: {
    value: {
      control: { type: 'number', min: 0, max: 100 },
      defaultValue: 50,
    },
    className: {
      control: { type: 'text' },
      defaultValue: '',
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof Progress>;

export const Basic: Story = {
  args: {
    value: 50,
  },
};

export const Full: Story = {
  args: {
    value: 100,
  },
};

export const Empty: Story = {
  args: {
    value: 0,
  },
};

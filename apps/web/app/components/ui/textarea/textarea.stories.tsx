import type { Meta, StoryObj } from '@storybook/react';

import { Textarea } from './textarea';

const meta = {
  title: 'ui/Textarea',
  component: Textarea,
  argTypes: {
    className: { control: 'text' },
    defaultValue: { control: 'text', defaultValue: 'Textarea text' },
    error: { control: 'boolean', defaultValue: false },
    errorMessage: { control: 'text', defaultValue: '' },
    placeholder: { control: 'text', defaultValue: 'Enter text...' },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Basic: Story = {
  args: {
    defaultValue: 'Basic Textarea',
  },
};

export const WithError: Story = {
  args: {
    defaultValue: 'Invalid input',
    error: true,
    errorMessage: 'This field is required.',
  },
};

export const PlaceholderOnly: Story = {
  args: {
    placeholder: 'Type your message...',
  },
};

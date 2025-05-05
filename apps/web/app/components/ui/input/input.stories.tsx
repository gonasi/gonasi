import type { Meta, StoryObj } from '@storybook/react';
import { AlertCircle, Mail, Search } from 'lucide-react';

import { Input } from './input';

const meta = {
  title: 'ui/Input',
  component: Input,
  argTypes: {
    className: { control: 'text' },
    type: { control: 'select', options: ['text', 'password', 'email', 'number'] },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
    leftIcon: { control: 'boolean' },
    rightIcon: { control: 'boolean' },
    error: { control: 'boolean' },
    errorMessage: { control: 'text' },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof Input>;

export const Basic: Story = {
  args: {
    placeholder: 'Enter text here',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Input is disabled',
  },
};

export const WithCustomClass: Story = {
  args: {
    className: 'border-secondary',
    placeholder: 'Custom styled input',
  },
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email',
  },
};

export const WithLeftIcon: Story = {
  args: {
    placeholder: 'Search...',
    leftIcon: <Search className='text-muted-foreground h-4 w-4' />,
  },
};

export const WithRightIcon: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email',
    rightIcon: <Mail className='text-muted-foreground h-4 w-4' />,
  },
};

export const WithBothIcons: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email',
    leftIcon: <Mail className='text-muted-foreground h-4 w-4' />,
    rightIcon: <AlertCircle className='text-muted-foreground h-4 w-4' />,
  },
};

export const WithError: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email',
    error: true,
    errorMessage: 'Please enter a valid email address',
    rightIcon: <AlertCircle className='text-danger h-4 w-4' />,
  },
};

export const WithErrorNoMessage: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email',
    error: true,
    rightIcon: <AlertCircle className='text-danger h-4 w-4' />,
  },
};

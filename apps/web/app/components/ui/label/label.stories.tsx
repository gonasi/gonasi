import type { Meta, StoryObj } from '@storybook/react';
import { Info } from 'lucide-react';

import { Label } from './label';

const meta = {
  title: 'ui/Label',
  component: Label,
  argTypes: {
    className: { control: 'text' },
    children: { control: 'text', defaultValue: 'Label text' },
    error: { control: 'boolean', description: 'Displays the label in red when true' },
    required: { control: 'boolean', description: 'Shows an asterisk when true' },
    endAdornment: {
      control: false,
      description: 'Displays a React component on the far right of the label',
    },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof Label>;

export const Basic: Story = {
  args: {
    children: 'Basic Label',
    error: false,
  },
};

export const WithError: Story = {
  args: {
    children: 'Label with error',
    error: true,
  },
};

export const Required: Story = {
  args: {
    children: 'Required Label',
    required: true,
  },
};

export const WithEndAdornment: Story = {
  args: {
    children: 'Label with End Adornment',
    endAdornment: <Info className='h-4 w-4' />,
  },
};

export const RequiredWithEndAdornment: Story = {
  args: {
    children: 'Required Label with End Adornment',
    required: true,
    endAdornment: <Info className='h-4 w-4' />,
  },
};

import type { Meta, StoryObj } from '@storybook/react';

import { Field, TextareaField } from './forms';

const meta: Meta = {
  title: 'ui/Forms',
  argTypes: {
    className: { control: 'text' },
    description: { control: 'text' },
    errors: { control: 'object' },
    labelProps: {
      control: 'object',
      defaultValue: { children: 'Label Text' },
    },
    inputProps: {
      control: 'object',
      defaultValue: { placeholder: 'Enter text here' },
    },
    textareaProps: {
      control: 'object',
      defaultValue: { placeholder: 'Enter longer text here' },
    },
  },
};

export default meta;

type FieldStory = StoryObj<typeof Field>;
type TextareaFieldStory = StoryObj<typeof TextareaField>;

export const BasicField: FieldStory = {
  render: (args) => <Field {...args} />,
  args: {
    labelProps: { children: 'Basic Field' },
    inputProps: { placeholder: 'Type here...' },
    description: 'Basic description',
  },
};

export const FieldWithErrors: FieldStory = {
  render: (args) => <Field {...args} />,
  args: {
    labelProps: { children: 'Field with Errors' },
    inputProps: { placeholder: 'Type here...' },
    errors: ['This field is required', 'Must be at least 5 characters'],
    description: 'Basic description',
  },
};

export const BasicTextareaField: TextareaFieldStory = {
  render: (args) => <TextareaField {...args} />,
  args: {
    labelProps: { children: 'Basic Textarea Field' },
    textareaProps: { placeholder: 'Type a longer message...' },
  },
};

export const TextareaWithErrors: TextareaFieldStory = {
  render: (args) => <TextareaField {...args} />,
  args: {
    labelProps: { children: 'Textarea with Errors' },
    textareaProps: { placeholder: 'Type a longer message...' },
    errors: ['This field is required', 'Max length exceeded'],
  },
};

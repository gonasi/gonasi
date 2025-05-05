import type { ComponentProps } from 'react';
import { BrowserRouter, Link } from 'react-router';
import type { Meta, StoryObj } from '@storybook/react';
import { ArrowRight, Home, LogIn, Mail, Settings } from 'lucide-react';

import { Button } from './Button';

type ButtonProps = ComponentProps<typeof Button>;
type OutlineButtonProps = ComponentProps<typeof Button>;

const iconOptions = {
  None: null,
  Mail: <Mail />,
  Home: <Home />,
  Settings: <Settings />,
  ArrowRight: <ArrowRight />,
  LogIn: <LogIn />,
};

const meta: Meta<typeof Button> = {
  title: 'ui/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'danger', 'success', 'warning', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    asChild: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    isLoading: {
      control: 'boolean',
    },
    leftIcon: {
      options: Object.keys(iconOptions),
      mapping: iconOptions,
      control: {
        type: 'select',
        labels: Object.keys(iconOptions),
      },
    },
    rightIcon: {
      options: Object.keys(iconOptions),
      mapping: iconOptions,
      control: {
        type: 'select',
        labels: Object.keys(iconOptions),
      },
    },
  },
  args: {
    variant: 'default',
    size: 'default',
    children: 'Button',
    leftIcon: null,
    rightIcon: null,
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div className='p-4'>
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className='flex flex-col gap-2'>
      {['default', 'secondary', 'danger', 'success', 'warning', 'ghost', 'link'].map((variant) => (
        <Button key={variant} variant={variant as ButtonProps['variant']}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

export const OutlineVariants: Story = {
  render: () => (
    <div className='flex flex-col gap-2'>
      {['default', 'secondary', 'danger', 'success', 'warning', 'ghost'].map((variant) => (
        <Button key={variant} variant={variant as OutlineButtonProps['variant']}>
          {variant} outline
        </Button>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className='flex flex-col gap-2'>
      <Button size='default'>Default size</Button>
      <Button size='sm'>Small size</Button>
      <Button size='lg'>Large size</Button>
      <Button size='icon'>
        <Settings />
      </Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className='flex flex-col gap-2'>
      <Button leftIcon={<Mail />}>Left Icon</Button>
      <Button rightIcon={<ArrowRight />}>Right Icon</Button>
      <Button leftIcon={<Mail />} rightIcon={<ArrowRight />}>
        Both Icons
      </Button>
      <Button leftIcon={<Mail />} rightIcon={<ArrowRight />}>
        Outline with Icons
      </Button>
    </div>
  ),
};

export const AsLink: Story = {
  render: () => (
    <div className='flex flex-col gap-2'>
      <Button asChild>
        <Link to='/home'>Default Link Button</Link>
      </Button>
      <Button asChild rightIcon={<LogIn />}>
        <Link to='/login'>Outline Link with Icon</Link>
      </Button>
      <Button asChild variant='ghost' leftIcon={<Home />}>
        <Link to='/dashboard'>Ghost Link with Icon</Link>
      </Button>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className='flex flex-col gap-2'>
      <Button disabled>Disabled Button</Button>
      <Button isLoading>Loading Button</Button>
      <Button isLoading leftIcon={<Mail />} rightIcon={<ArrowRight />}>
        Loading with Icons
      </Button>
      <Button disabled>Disabled Outline</Button>
      <Button isLoading>Loading Outline</Button>
    </div>
  ),
};

export const IconButtons: Story = {
  render: () => (
    <div className='flex gap-2'>
      <Button size='icon' variant='default'>
        <Settings />
      </Button>
      <Button size='icon' variant='secondary'>
        <Mail />
      </Button>
      <Button size='icon' variant='default'>
        <Home />
      </Button>
    </div>
  ),
};

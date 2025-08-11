import type { PropsWithChildren } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, X } from 'lucide-react';

import { AppLogo } from '~/components/app-logo';
import { buttonVariants } from '~/components/ui/button';

interface AuthFormLayoutProps extends PropsWithChildren {
  title: string;
  description: React.ReactNode;
  leftLink: string;
  closeLink?: string;
}

export function AuthFormLayout(props: AuthFormLayoutProps) {
  const { children, title, description, leftLink, closeLink } = props;

  return (
    <div className='border-card rounded-md border-0 px-4 py-8 shadow-none md:border-1'>
      <div className='grid grid-cols-3 items-center pb-4'>
        <Link
          to={leftLink}
          className={(buttonVariants({ variant: 'ghost' }), 'justify-self-start')}
        >
          <ArrowLeft />
        </Link>
        <div className='justify-self-center'>
          <AppLogo />
        </div>
        {closeLink ? (
          <Link
            to={closeLink}
            className={(buttonVariants({ variant: 'ghost' }), 'justify-self-end')}
          >
            <X />
          </Link>
        ) : (
          <div />
        )}
      </div>
      <div className='flex items-center justify-center'>
        <h2 className='text-2xl'>{title}</h2>
      </div>
      <div className='font-secondary text-center text-sm'>{description}</div>
      <div className='pb-4' />
      <div>{children}</div>
    </div>
  );
}

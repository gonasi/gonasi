import { Outlet } from 'react-router';
import { Plus } from 'lucide-react';

import type { Route } from './+types/organizations-index';

import { AppLogo } from '~/components/app-logo';
import { UserAvatar } from '~/components/avatars';
import { BackArrowNavLink, NavLinkButton } from '~/components/ui/button';
import { cn } from '~/lib/utils';

export default function PastIndex({ params }: Route.ComponentProps) {
  return (
    <>
      <div className='mx-auto flex max-w-md flex-col space-y-4 px-4 md:py-10'>
        <div className='grid grid-cols-3 items-center py-4'>
          <div className='w-fit'>
            <BackArrowNavLink to={`/go/${params.username}`} />
          </div>
          <div className='flex w-full items-center justify-center'>
            <AppLogo />
          </div>
          <div />
        </div>
        <div className='flex w-full items-center justify-between'>
          <div>
            <h4>Organizations</h4>
          </div>
        </div>
        <div className='py-4'>
          <div className='flex flex-col space-y-4'>
            <UserAvatar username='say what' imageUrl='' isActive size='sm' />
          </div>
        </div>
        <div>
          <NavLinkButton
            to={`/go/${params.username}/organizations/new`}
            variant='ghost'
            size='sm'
            leftIcon={<Plus />}
            className={cn('border-border/50 w-full border')}
          >
            Create Organization
          </NavLinkButton>
        </div>
      </div>
      <Outlet />
    </>
  );
}

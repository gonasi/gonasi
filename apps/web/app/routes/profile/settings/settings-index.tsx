import { Outlet, useLocation } from 'react-router';
import { UserRoundPen } from 'lucide-react';

import type { Route } from './+types/settings-index';

import { AppLogo } from '~/components/app-logo';
import { SideLink } from '~/components/go-sidebar/side-link';
import { BackArrowNavLink, CloseIconNavLink } from '~/components/ui/button';

export default function SettingsIndex({ params }: Route.ComponentProps) {
  const location = useLocation();
  const routeParams = new URLSearchParams(location.search);
  const redirectTo = routeParams.get('redirectTo');

  let closeLink = '/';

  if (redirectTo) {
    closeLink = redirectTo;
  }

  return (
    <div className='mx-auto flex max-w-2xl space-x-4 md:space-x-8'>
      <aside className='border-r-border sticky h-full min-h-screen w-fit flex-none border-r md:w-48 lg:w-56'>
        <div className='mb-10 pt-8 pr-0 md:pr-10'>
          <div className='flex items-center justify-center space-x-8 md:justify-start'>
            <div className='hidden md:flex'>
              <BackArrowNavLink to={closeLink} />
            </div>
            <div className='flex items-center'>
              <AppLogo sizeClass='h-6' />
              <h2 className='mt-1 hidden text-sm md:mt-2 md:flex md:text-xl'>onasi</h2>
            </div>
          </div>
        </div>
        <SideLink
          to={`/${params.username}/settings/profile`}
          name='Profile'
          icon={UserRoundPen}
          end
        />
        <SideLink
          to={`/${params.username}/settings/payment`}
          name='Payment'
          icon={UserRoundPen}
          end
        />
      </aside>
      <section className='w-full py-8 pr-4'>
        <div className='flex w-full justify-end pb-4 md:hidden'>
          <CloseIconNavLink to={closeLink} />
        </div>
        <div>
          <Outlet />
        </div>
      </section>
    </div>
  );
}

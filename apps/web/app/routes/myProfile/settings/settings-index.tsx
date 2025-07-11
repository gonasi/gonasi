import { Outlet, useLocation } from 'react-router';
import { Bell, Lock, UserRoundCog } from 'lucide-react';

import type { Route } from './+types/settings-index';

import { AppLogo } from '~/components/app-logo';
import { SideLink } from '~/components/go-sidebar/side-link';
import { BackArrowNavLink, CloseIconNavLink } from '~/components/ui/button';

export function meta() {
  return [
    { title: 'Profile Settings • Gonasi' },
    {
      name: 'description',
      content: 'Manage your profile details, visibility, and account preferences on Gonasi.',
    },
  ];
}

export default function SettingsIndex({ params }: Route.ComponentProps) {
  const location = useLocation();
  const redirectTo = new URLSearchParams(location.search).get('redirectTo') || '/';

  const sections = [
    {
      heading: 'Account Settings',
      links: [
        {
          name: 'Profile',
          to: `/go/${params.username}/settings/profile-information`,
          icon: UserRoundCog,
        },
        {
          name: 'Login & Security',
          to: `/go/${params.username}/settings/login-and-security`,
          icon: Lock,
        },
        {
          name: 'Notifications',
          to: `/go/${params.username}/settings/notifications`,
          icon: Bell,
        },
      ],
    },
  ];

  return (
    <div className='mx-auto flex space-x-4 lg:space-x-8'>
      <aside className='border-r-border sticky h-full min-h-screen w-fit flex-none border-r pl-0 md:w-48 md:pl-2 lg:w-56'>
        <div className='mb-10 pt-8 pr-0 md:pr-10'>
          <div className='flex items-center justify-center space-x-6 md:justify-start'>
            <div className='hidden md:flex'>
              <BackArrowNavLink to={redirectTo} />
            </div>
            <div className='flex items-center'>
              <AppLogo sizeClass='h-6' />
              <h2 className='mt-1 hidden text-sm md:mt-2 md:flex md:text-xl'>onasi</h2>
            </div>
          </div>
        </div>

        {sections.map(({ heading, links }) => (
          <div key={heading}>
            <h2 className='font-secondary hidden py-2 font-semibold md:flex'>{heading}</h2>
            <div className='flex flex-col space-y-4 py-4 md:space-y-1 md:py-1'>
              {links.map(({ name, to, icon }) => (
                <SideLink key={to} to={to} name={name} icon={icon} end />
              ))}
            </div>
          </div>
        ))}
      </aside>

      <section className='w-full py-8 pr-4 lg:pr-0'>
        <div className='flex w-full justify-end pb-6 md:hidden md:pb-4'>
          <CloseIconNavLink to={redirectTo} />
        </div>
        <div>
          <Outlet />
        </div>
      </section>
    </div>
  );
}

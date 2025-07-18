import { NavLink } from 'react-router';

import { AppLogo } from '~/components/app-logo';
import { SideLink } from '~/components/go-sidebar/side-link';
import type { DashboardLink } from '~/hooks/useDashboardLinks';

interface IDesktopNavProps {
  links: DashboardLink[];
}

export function DesktopNav({ links }: IDesktopNavProps) {
  return (
    <nav className='md:border-border/40 md:bg-border/20 hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col md:border-r md:pt-5 md:pb-4'>
      <NavLink className='flex flex-shrink-0 px-4 py-2' to='/'>
        <AppLogo sizeClass='h-6' />
        <p className='mt-1'>onasi</p>
      </NavLink>
      <div className='mt-8 flex flex-grow flex-col'>
        <nav className='flex-1 space-y-1 pl-2'>
          {links.map((link) => (
            <SideLink key={link.to} icon={link.icon} to={link.to} name={link.name} end />
          ))}
        </nav>
      </div>
    </nav>
  );
}

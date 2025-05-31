import { Link, NavLink } from 'react-router';
import { House, Telescope } from 'lucide-react';

import { Container } from '../../layouts/container';
import { ProfileDropdown } from '../../profile-dropdown';
import { buttonVariants } from '../../ui/button';
import { TopNavLink } from './top-nav-link';

import { AppLogo } from '~/components/app-logo';
import type {
  UserActiveCompanyLoaderReturnType,
  UserProfileLoaderReturnType,
  UserRoleLoaderReturnType,
} from '~/root';

interface Props {
  user?: UserProfileLoaderReturnType;
  role?: UserRoleLoaderReturnType;
  activeCompany: UserActiveCompanyLoaderReturnType;
}

export function TopNav({ user, role = 'user', activeCompany }: Props) {
  return (
    <nav className='border-b-card hidden h-16 w-full items-center border-b md:flex md:h-20 md:px-4'>
      <Container className='h-full'>
        <div className='flex h-full items-center justify-between'>
          <div className='flex h-full items-center space-x-10'>
            <Link to='/' className='flex items-center'>
              <AppLogo />
            </Link>

            <div className='flex h-full items-center space-x-4'>
              <TopNavLink icon={<House size={20} />} to='/' name='Home' />
              <TopNavLink icon={<Telescope size={20} />} to='/explore' name='Explore' />
            </div>
          </div>
          {user ? (
            <div>
              <ProfileDropdown user={user} role={role} activeCompany={activeCompany} />
            </div>
          ) : (
            <div className='flex space-x-2'>
              <NavLink
                to='/login'
                className={`${buttonVariants({ variant: 'default' })} rounded-full`}
              >
                Log in
              </NavLink>
              <NavLink
                to='/signup'
                className={`${buttonVariants({ variant: 'ghost' })} border-card rounded-full border`}
              >
                Sign up
              </NavLink>
            </div>
          )}
        </div>
      </Container>
    </nav>
  );
}

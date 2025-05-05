import { Link, NavLink } from 'react-router';
import { House, LibraryBig } from 'lucide-react';

import { Container } from '../layouts/container';
import { ProfileDropdown } from '../profile-dropdown';
import { buttonVariants } from '../ui/button';
import { GoTopNavLink } from './go-top-nav-link';

import { AppLogo } from '~/components/app-logo';
import type {
  UserActiveCompanyLoaderReturnType,
  UserProfileLoaderReturnType,
  UserRoleLoaderReturnType,
} from '~/root';

interface Props {
  user: UserProfileLoaderReturnType;
  role: UserRoleLoaderReturnType;
  activeCompany: UserActiveCompanyLoaderReturnType;
}

export function TopNav({ user, role, activeCompany }: Props) {
  return (
    <nav className='border-b-card flex h-16 w-full items-center border-b md:h-20'>
      <Container className='h-full'>
        <div className='flex h-full items-center justify-between'>
          <div className='flex h-full items-center space-x-10'>
            <Link to={user ? '/go' : '/'} className='flex items-center'>
              <AppLogo />
            </Link>

            {user && (
              <div className='flex h-full items-center space-x-4'>
                <GoTopNavLink icon={<House size={20} />} to='/go' name='Home' />
                <GoTopNavLink icon={<LibraryBig size={20} />} to='/go/courses' name='Courses' />
              </div>
            )}
          </div>
          {user ? (
            <div>
              <ProfileDropdown user={user} role={role} activeCompany={activeCompany} />
            </div>
          ) : (
            <NavLink
              to='/login'
              className={`${buttonVariants({ variant: 'ghost' })} border-card rounded-full border`}
            >
              Log in
            </NavLink>
          )}
        </div>
      </Container>
    </nav>
  );
}

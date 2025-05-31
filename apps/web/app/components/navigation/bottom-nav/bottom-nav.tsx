import { House, Telescope, UserRound } from 'lucide-react';

import { ProfileDropdown } from '../../profile-dropdown';
import { BottomNavLink } from './bottom-nav-link';

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

export function BottomNav({ user, role = 'user', activeCompany }: Props) {
  return (
    <nav className='fixed bottom-0 min-h-12 w-full px-0 md:hidden'>
      <div className='from-secondary/30 to-primary/30 h-0.5 bg-gradient-to-r' />
      <div className='flex h-full items-center justify-between p-4'>
        <BottomNavLink icon={House} to='/' />
        <BottomNavLink icon={Telescope} to='/explore' />

        <div>
          {user ? (
            <div>
              <ProfileDropdown user={user} role={role} activeCompany={activeCompany} />
            </div>
          ) : (
            <BottomNavLink icon={UserRound} to='/login' />
          )}
        </div>
      </div>
    </nav>
  );
}

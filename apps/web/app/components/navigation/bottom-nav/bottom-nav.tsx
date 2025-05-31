import { NavLink } from 'react-router';
import { House, Telescope, UserRound } from 'lucide-react';

import { BottomNavLink } from './bottom-nav-link';

import { PlainAvatar } from '~/components/avatars';
import type { UserActiveCompanyLoaderReturnType } from '~/root';

interface Props {
  activeCompany: UserActiveCompanyLoaderReturnType;
}

export function BottomNav({ activeCompany }: Props) {
  return (
    <nav className='fixed bottom-0 h-18 w-full px-0 md:hidden'>
      <div className='from-secondary/30 to-primary/30 h-0.5 bg-gradient-to-r' />
      <div className='flex h-full items-center justify-between px-4'>
        <BottomNavLink icon={House} to='/' />
        <BottomNavLink icon={Telescope} to='/explore' />
        <div>
          {activeCompany ? (
            <div>
              <NavLink to={`/${activeCompany.profiles.username}`}>
                {({ isActive, isPending }) => (
                  <span aria-disabled={isActive}>
                    <PlainAvatar
                      username={activeCompany.profiles.username}
                      imageUrl={activeCompany.profiles.avatar_url}
                      isActive={isActive}
                      isPending={isPending}
                      size='sm'
                    />
                  </span>
                )}
              </NavLink>
            </div>
          ) : (
            <BottomNavLink icon={UserRound} to='/login' />
          )}
        </div>
      </div>
    </nav>
  );
}

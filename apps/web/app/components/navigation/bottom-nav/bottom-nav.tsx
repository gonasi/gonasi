import { NavLink } from 'react-router';
import { House, Telescope, UserRound } from 'lucide-react';

import { BottomNavLink } from './bottom-nav-link';

import { PlainAvatar } from '~/components/avatars';
import type { UserProfileLoaderReturnType } from '~/root';

interface Props {
  user?: UserProfileLoaderReturnType;
}

export function BottomNav({ user }: Props) {
  return (
    <nav className='fixed bottom-0 h-18 w-full px-0 md:hidden'>
      <div className='from-secondary/30 to-primary/30 h-0.5 bg-gradient-to-r' />
      <div className='flex h-full items-center justify-between px-4'>
        <BottomNavLink icon={House} to='/' />
        <BottomNavLink icon={Telescope} to='/explore' />
        <div>
          {user ? (
            <div>
              <NavLink to={`/${user.username}`}>
                {({ isActive, isPending }) => (
                  <span aria-disabled={isActive}>
                    <PlainAvatar
                      username={user.username}
                      imageUrl={user.avatar_url}
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

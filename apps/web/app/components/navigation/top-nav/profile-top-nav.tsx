import { Container } from '../../layouts/container';
import { ProfileDropdown } from '../../profile-dropdown';
import { OrganizationSelectorButton } from './organization-selector';

import { BackArrowNavLink } from '~/components/ui/button';
import type { UserProfileLoaderReturnType } from '~/root';

interface Props {
  user: UserProfileLoaderReturnType;
  showName?: boolean;
}

export function ProfileTopNav({ user, showName = false }: Props) {
  return (
    <nav className='flex h-14 w-full items-center md:h-20 md:px-4'>
      <Container className='h-full'>
        <div className='flex h-full items-center justify-between'>
          <div className='flex h-full items-center space-x-4 md:space-x-8'>
            <BackArrowNavLink to='/' />
            {user ? (
              <OrganizationSelectorButton to={`/go/${user?.username}/organizations`} />
            ) : null}
          </div>

          <div>
            <ProfileDropdown user={user} showName={showName} size='sm' />
          </div>
        </div>
      </Container>
    </nav>
  );
}

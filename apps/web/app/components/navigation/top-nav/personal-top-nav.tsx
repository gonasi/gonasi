// PersonalTopNav.tsx
import { OrganizationSelectorButton } from './organization-selector';

import { Container } from '~/components/layouts/container';
import { ProfileDropdown } from '~/components/profile-dropdown';
import { BackArrowNavLink } from '~/components/ui/button';
import type { UserProfileLoaderReturnType, UserRoleLoaderReturnType } from '~/root';

interface PersonalTopNavProps {
  user: UserProfileLoaderReturnType;
  userRole: UserRoleLoaderReturnType;
  showBackArrow?: boolean;
}

export function PersonalTopNav({ user, userRole, showBackArrow = true }: PersonalTopNavProps) {
  return (
    <nav className='border-b-border/40 flex h-14 w-full items-center border-b md:h-20 md:px-4'>
      <Container className='h-full'>
        <div className='flex h-full items-center justify-between'>
          {/* LEFT */}
          <div className='flex h-full items-center space-x-4 md:space-x-8'>
            {showBackArrow && <BackArrowNavLink to='/' />}

            <OrganizationSelectorButton to={`/go/${user?.username}/organizations`} />
          </div>

          <div>
            <ProfileDropdown user={user} userRole={userRole} size='sm' />
          </div>
        </div>
      </Container>
    </nav>
  );
}

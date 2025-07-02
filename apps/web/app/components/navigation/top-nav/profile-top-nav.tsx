import { Container } from '../../layouts/container';
import { ProfileDropdown } from '../../profile-dropdown';
import { OrganizationSelectorButton } from './organization-selector';

import { PlainAvatar } from '~/components/avatars';
import { BackArrowNavLink } from '~/components/ui/button';
import type { UserProfileLoaderReturnType } from '~/root';
import type {
  MemberLoaderData,
  OrganizationLoaderData,
} from '~/routes/layouts/organizations/organizations-layout';

interface ProfileTopNavProps {
  user: UserProfileLoaderReturnType;
  organization?: OrganizationLoaderData;
  member?: MemberLoaderData;
  showBackArrow?: boolean;
}

export function ProfileTopNav({
  user,
  organization,
  showBackArrow = false,
  member,
}: ProfileTopNavProps) {
  const showOrgLabel = organization && user?.mode !== 'personal';

  return (
    <nav className='flex h-14 w-full items-center md:h-20 md:px-4'>
      <Container className='h-full'>
        <div className='flex h-full items-center justify-between'>
          <div className='flex h-full items-center space-x-4 md:space-x-8'>
            {showBackArrow && user?.mode === 'personal' ? <BackArrowNavLink to='/' /> : null}

            {user && (
              <OrganizationSelectorButton
                to={`/go/${user.username}/organizations`}
                organizationLabel={
                  showOrgLabel ? (
                    <div className='flex max-w-46 items-center space-x-2 md:max-w-60'>
                      <PlainAvatar
                        username={organization.name}
                        imageUrl={organization.avatar_url}
                        isActive
                        size='xs'
                      />
                      <span className='w-fit truncate'>{organization.name}</span>
                    </div>
                  ) : undefined
                }
              />
            )}
          </div>

          <div>
            <ProfileDropdown user={user} size='sm' organization={organization} member={member} />
          </div>
        </div>
      </Container>
    </nav>
  );
}

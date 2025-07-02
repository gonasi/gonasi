import { Container } from '../../layouts/container';
import { ProfileDropdown } from '../../profile-dropdown';
import { OrganizationSelectorButton } from './organization-selector';

import { PlainAvatar } from '~/components/avatars';
import type { UserProfileLoaderReturnType } from '~/root';
import type { OrganizationLoaderData } from '~/routes/layouts/organizations/organizations-layout';

interface Props {
  user: UserProfileLoaderReturnType;
  organization: OrganizationLoaderData;
}

export function OrganizationTopNav({ user, organization }: Props) {
  return (
    <nav className='flex h-14 w-full items-center md:h-20 md:px-4'>
      <Container className='h-full'>
        <div className='flex h-full items-center justify-between'>
          <div className='flex h-full items-center space-x-4 md:space-x-8'>
            {user ? (
              <OrganizationSelectorButton
                to={`/go/${user?.username}/organizations`}
                organizationLabel={
                  <div className='flex max-w-46 items-center space-x-2 md:max-w-60'>
                    <PlainAvatar
                      username={organization.name}
                      imageUrl={organization.avatar_url}
                      isActive
                      size='xs'
                    />
                    <span className='w-fit truncate'>
                      {organization.name} asdf lasdfk asdklfj asdklfj asdkf
                    </span>
                  </div>
                }
              />
            ) : null}
          </div>

          <div>
            <ProfileDropdown user={user} showName={false} size='sm' />
          </div>
        </div>
      </Container>
    </nav>
  );
}

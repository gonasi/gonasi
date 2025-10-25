import { MobileNav } from './responsive-nav/mobile-nav';
import { Container } from '../../layouts/container';
import { ProfileDropdown } from '../../profile-dropdown';
import { OrganizationSelectorButton } from './organization-selector';

import { PlainAvatar } from '~/components/avatars';
import { BackArrowNavLink } from '~/components/ui/button';
import { useDashboardLinks } from '~/hooks/useDashboardLinks';
import { cn } from '~/lib/utils';
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
  loading: boolean;
}

export function ProfileTopNav({
  user,
  organization,
  showBackArrow = true,
  member,
  loading,
}: ProfileTopNavProps) {
  const showOrgLabel = organization && user?.mode !== 'personal';

  const filteredLinks = useDashboardLinks({
    organizationId: organization?.id ?? '',
    role: member?.role ?? 'editor',
  });

  return (
    <>
      <nav className='border-b-border/40 flex h-14 w-full items-center border-b md:h-20 md:px-4'>
        <Container className='h-full'>
          <div className='flex h-full items-center justify-between'>
            <div className='flex h-full items-center space-x-4 md:space-x-8'>
              {showBackArrow && user?.mode === 'personal' ? <BackArrowNavLink to='/' /> : null}
              {user && !loading && (
                <div className='flex items-center justify-center gap-4'>
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
                </div>
              )}
              {loading && (
                <span
                  className={cn(
                    'bg-card/80 h-11 w-56 animate-pulse rounded-full border-2 border-dashed px-2 py-2 text-sm font-medium md:w-72',
                    'border-muted-foreground/40',
                  )}
                />
              )}
            </div>
            {!loading && user && (
              <>
                <div className={cn(user.mode === 'personal' ? 'hidden' : 'md:hidden')}>
                  <MobileNav links={filteredLinks} />
                </div>
                <div className={cn(user.mode === 'personal' ? 'block' : 'hidden md:block')}>
                  <ProfileDropdown
                    user={user}
                    size='sm'
                    organization={organization}
                    member={member}
                  />
                </div>
              </>
            )}
            {loading && <div className='bg-card/60 h-11 w-11 animate-pulse rounded-lg' />}
          </div>
        </Container>
      </nav>
    </>
  );
}

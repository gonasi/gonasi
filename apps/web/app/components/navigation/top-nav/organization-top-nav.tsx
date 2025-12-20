import { MobileNav } from './responsive-nav/mobile-nav';
import { OrganizationSelectorButton } from './organization-selector';
import { OrganizationNotifications } from './organizationNotifications';

import { PlainAvatar } from '~/components/avatars';
import { Container } from '~/components/layouts/container';
import { ProfileDropdown } from '~/components/profile-dropdown';
import { useDashboardLinks } from '~/hooks/useDashboardLinks';
import { cn } from '~/lib/utils';
import type { UserProfileLoaderReturnType, UserRoleLoaderReturnType } from '~/root';
import type {
  OrganizationLoaderData,
  OrgRoleLoaderData,
} from '~/routes/layouts/organizations/organizations-layout';

interface OrganizationTopNavProps {
  user: UserProfileLoaderReturnType;
  userRole: UserRoleLoaderReturnType;
  organization: OrganizationLoaderData;
  orgRole: OrgRoleLoaderData;
  loading: boolean;
}

export function OrganizationTopNav({
  user,
  userRole,
  organization,
  orgRole,
  loading,
}: OrganizationTopNavProps) {
  const showOrgLabel = !!organization;

  const filteredLinks = useDashboardLinks({
    organizationId: organization?.id ?? '',
    role: orgRole,
  });

  return (
    <nav className='border-b-border/40 flex h-14 w-full items-center border-b md:h-20 md:px-4'>
      <Container className='h-full'>
        <div className='flex h-full items-center justify-between'>
          {/* LEFT */}
          <div className='flex h-full items-center space-x-4 md:space-x-8'>
            {!loading && (
              <div className='flex items-center gap-4'>
                <OrganizationSelectorButton
                  to={`/go/${user?.username}/organizations`}
                  organizationLabel={
                    showOrgLabel ? (
                      <div className='flex max-w-46 items-center space-x-2 md:max-w-60'>
                        <PlainAvatar
                          username={organization.name}
                          imageUrl={organization.signed_avatar_url}
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

          {/* RIGHT */}
          {!loading ? (
            <>
              {/* Mobile */}
              <div className='md:hidden'>
                <OrganizationNotifications
                  organizationId={organization?.id ?? ''}
                  memberRole={orgRole}
                />
                <MobileNav links={filteredLinks} />
              </div>

              {/* Desktop */}
              <div className='hidden items-center space-x-4 md:flex'>
                <OrganizationNotifications
                  organizationId={organization?.id ?? ''}
                  memberRole={orgRole}
                />
                <ProfileDropdown
                  user={user}
                  userRole={userRole}
                  size='sm'
                  organization={organization}
                  member={orgRole}
                />
              </div>
            </>
          ) : (
            <div className='bg-card/60 h-11 w-11 animate-pulse rounded-lg' />
          )}
        </div>
      </Container>
    </nav>
  );
}

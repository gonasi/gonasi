import { Link, useLocation } from 'react-router';
import { ChevronsUpDown, LayoutDashboard, User } from 'lucide-react';

import { type AvatarSize, UserAvatar } from '../avatars';
import { getBadgeColorClass } from '../cards/organization-switcher';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { cn } from '~/lib/utils';
import type { UserProfileLoaderReturnType } from '~/root';
import type {
  MemberLoaderData,
  OrganizationLoaderData,
} from '~/routes/layouts/organizations/organizations-layout';

interface Props {
  user: UserProfileLoaderReturnType;
  dropdownPosition?: 'top' | 'bottom' | 'left' | 'right';
  dropdownAlign?: 'start' | 'center' | 'end';
  showName?: boolean;
  size?: AvatarSize;
  organization?: OrganizationLoaderData;
  member?: MemberLoaderData;
}

export function ProfileDropdown({
  user,
  dropdownPosition = 'bottom',
  dropdownAlign = 'end',
  showName = true,
  size,
  organization,
  member,
}: Props) {
  const location = useLocation();
  if (!user) return null;

  const { username, full_name, signed_url, mode, active_organization_id } = user;

  const isViewingPersonal = location.pathname === `/go/${username}`;

  const navLink = {
    to: mode === 'personal' ? `/go/${username}` : `/${active_organization_id}`,
    label: mode === 'personal' ? 'Profile' : 'Dashboard',
    icon: mode === 'personal' ? User : LayoutDashboard,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className='bg-background w-full rounded-full p-1 outline-0'>
          <div className='flex items-center'>
            <UserAvatar
              username={username}
              imageUrl={signed_url}
              isActive={isViewingPersonal}
              showName={showName}
              size={size}
            />
            {showName && <ChevronsUpDown className='text-muted-foreground mb-0.5' />}
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className='w-56'
        side={dropdownPosition}
        align={dropdownAlign}
        forceMount
      >
        <DropdownMenuLabel>
          <div className='space-y-1'>
            {mode === 'personal' ? (
              <p className='text-sm font-medium'>{full_name}</p>
            ) : (
              <div>
                <p className='truncate text-lg'>{organization?.name}</p>
                <div className='flex items-center justify-between'>
                  <p className='font-secondary text-muted-foreground truncate'>{full_name}</p>
                  {member?.role && (
                    <Badge
                      variant='outline'
                      className={cn('rounded-full text-xs', getBadgeColorClass(member.role))}
                    >
                      {member.role}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild className='group cursor-pointer'>
            <Link to={navLink.to} className='flex items-center space-x-2'>
              <navLink.icon className='h-4 w-4 transition-transform duration-200 group-hover:scale-105' />
              <span>{navLink.label}</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className='group cursor-pointer'>
          <Link to='/signout' className='flex items-center space-x-2'>
            <span>Sign Out</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

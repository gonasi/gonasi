import { Link, useLocation } from 'react-router';
import { ChevronsUpDown, LayoutDashboard, User } from 'lucide-react';

import { type AvatarSize, UserAvatar } from '../avatars';
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
import type { UserProfileLoaderReturnType } from '~/root';

interface Props {
  user: UserProfileLoaderReturnType;
  dropdownPosition?: 'top' | 'bottom' | 'left' | 'right';
  dropdownAlign?: 'start' | 'center' | 'end';
  showName?: boolean;
  size?: AvatarSize;
}

export function ProfileDropdown({
  user,
  dropdownPosition = 'bottom',
  dropdownAlign = 'end',
  showName = true,
  size,
}: Props) {
  const location = useLocation();

  if (!user) return;

  const { username, full_name, signed_url, mode, active_organization_id } = user;

  const isActive = location.pathname === `/go/${username}`;

  const menuItems = [
    {
      to: mode === 'personal' ? `/go/${username}` : `/${active_organization_id}`,
      label: mode === 'personal' ? 'Profile' : 'Dashboard',
      icon: mode === 'personal' ? User : LayoutDashboard,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className='bg-background w-full rounded-full p-1 outline-0'>
          <div className='flex items-center'>
            <UserAvatar
              username={username}
              imageUrl={signed_url}
              isActive={isActive}
              showName={showName}
              size={size}
            />
            {showName ? <ChevronsUpDown className='text-muted-foreground mb-0.5' /> : null}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-56'
        side={dropdownPosition} // Controls position (top, bottom, left, right)
        align={dropdownAlign} // Controls alignment (start, center, end)
        forceMount
      >
        <DropdownMenuLabel>
          <div className='space-y-1'>
            <p className='text-sm font-medium'>{full_name}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {menuItems.map(({ to, label, icon: Icon }) => {
            return (
              <DropdownMenuItem key={to} asChild className='group cursor-pointer'>
                <Link to={to} className='flex items-center space-x-2'>
                  <Icon className='h-4 w-4 transition-transform duration-200 group-hover:scale-105' />
                  <span>{label}</span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className='group cursor-pointer'>
          <DropdownMenuItem asChild className='group cursor-pointer'>
            <Link to='/signout' className='flex items-center space-x-2'>
              <span>Sign Out</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

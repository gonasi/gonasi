import { Link, useLocation } from 'react-router';
import { ArrowRightLeft, ChevronsUpDown, LayoutDashboard } from 'lucide-react';

import { UserAvatar } from '../avatars';
import { NotFoundCard } from '../cards';
import { SignOut } from '../sign-out';
import { Button, buttonVariants } from '../ui/button';

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
}

export function ProfileDropdown({
  user,
  dropdownPosition = 'bottom',
  dropdownAlign = 'end',
}: Props) {
  const location = useLocation();

  if (!user) return <NotFoundCard message='user not found' />;

  const { username, full_name, avatar_url } = user;

  const isActive = location.pathname === `/${username}`;

  const menuItems = [
    { to: `/${username}`, label: 'Profile', icon: LayoutDashboard },
    { to: '/profile', label: 'Change account', icon: ArrowRightLeft },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className='bg-background w-full rounded-full p-1 outline-0'>
          <div className='flex items-center'>
            <UserAvatar username={username} imageUrl={avatar_url} isActive={isActive} />
            <ChevronsUpDown className='text-muted-foreground mb-0.5' />
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
                  <Icon className='h-4 w-4 transition-transform duration-200 group-hover:scale-110' />
                  <span>{label}</span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className='group cursor-pointer'>
          <SignOut
            signOutComponent={
              <div
                className={`${buttonVariants({ size: 'sm', variant: 'secondary' })} m-2 rounded-full px-4`}
              >
                <span>Sign out</span>
              </div>
            }
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

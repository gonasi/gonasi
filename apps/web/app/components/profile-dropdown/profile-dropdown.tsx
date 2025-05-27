import { Link, useLocation } from 'react-router';
import { ChevronsUpDown, LayoutDashboard, LogOut } from 'lucide-react';

import { PlainAvatar, UserAvatar } from '../avatars';
import { NotFoundCard } from '../cards';
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
import type {
  UserActiveCompanyLoaderReturnType,
  UserProfileLoaderReturnType,
  UserRoleLoaderReturnType,
} from '~/root';

interface Props {
  user: UserProfileLoaderReturnType;
  role: UserRoleLoaderReturnType;
  activeCompany: UserActiveCompanyLoaderReturnType;
  dropdownPosition?: 'top' | 'bottom' | 'left' | 'right';
  dropdownAlign?: 'start' | 'center' | 'end';
}

export function ProfileDropdown({
  user,
  role,
  activeCompany,
  dropdownPosition = 'bottom',
  dropdownAlign = 'end',
}: Props) {
  const location = useLocation();

  if (!user || !activeCompany) return <NotFoundCard message='user not found' />;

  const { email, full_name } = user;

  const menuItems = [
    { to: `/dashboard/${activeCompany.company_id}`, label: 'Dashboard', icon: LayoutDashboard },
    // { to: '/profile', label: 'Profile', icon: User },
    // { to: '/settings', label: 'Settings', icon: Settings },
    // { to: '/billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className='bg-background w-full rounded-full p-0 outline-0'>
          <div className='hidden items-center md:flex'>
            <UserAvatar username={user.username} imageUrl={user.avatar_url} />
            <ChevronsUpDown className='text-muted-foreground mb-0.5' />
          </div>
          <div className='flex md:hidden'>
            <PlainAvatar username={user.username} imageUrl={user.avatar_url} />
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
            <p className='text-muted-foreground text-xs'>{email}</p>
            <p className='text-muted-foreground text-xs'>{role}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {menuItems.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <DropdownMenuItem key={to} asChild className='group cursor-pointer'>
                <Link
                  to={to}
                  className={`flex items-center space-x-2 ${
                    isActive ? 'bg-muted text-primary' : ''
                  }`}
                >
                  <Icon className='h-4 w-4 transition-transform duration-200 group-hover:scale-110' />
                  <span>{label}</span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className='group cursor-pointer'>
          <Link to='/sign-out' className='flex items-center space-x-2'>
            <LogOut className='h-4 w-4 transition-transform duration-200 group-hover:scale-110' />
            <span>Sign out</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

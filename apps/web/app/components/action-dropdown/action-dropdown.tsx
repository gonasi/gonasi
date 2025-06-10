import { NavLink } from 'react-router';
import type { LucideIcon } from 'lucide-react';
import { MoreVertical } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

export interface ActionItem {
  title: string;
  icon: LucideIcon;
  to?: string;
  from?: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface ActionDropdownProps {
  items: ActionItem[];
  triggerIcon?: LucideIcon;
  align?: 'start' | 'end' | 'center';
}

export function ActionDropdown({
  items,
  triggerIcon: TriggerIcon = MoreVertical,
  align = 'end',
}: ActionDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span
          className='border-border/10 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex h-8 w-8 items-center justify-center rounded-md border bg-transparent p-0 focus-visible:ring-1 focus-visible:outline-none'
          role='button'
          tabIndex={0}
        >
          <TriggerIcon className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {items.map((item, index) => {
          const Icon = item.icon;
          const menuItem = (
            <>
              {Icon && <Icon className='mr-2 h-4 w-4' />}
              <span>{item.title}</span>
            </>
          );

          return item.to ? (
            <NavLink
              key={index}
              to={item.to}
              state={{ from: item.from }}
              className='flex w-full items-center'
            >
              <DropdownMenuItem className='w-full' disabled={item.disabled}>
                {menuItem}
              </DropdownMenuItem>
            </NavLink>
          ) : (
            <DropdownMenuItem
              key={index}
              className='w-full'
              onClick={!item.disabled ? item.onClick : undefined}
              disabled={item.disabled}
            >
              {menuItem}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

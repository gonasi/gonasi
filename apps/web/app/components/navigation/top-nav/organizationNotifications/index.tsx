import { Bell, Clock } from 'lucide-react';

import type { Database } from '@gonasi/database/schema';

import { useOrgNotifications } from './useOrgNotifications';

import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

export function OrganizationNotifications({
  organizationId,
  memberRole = 'owner',
}: {
  organizationId: string;
  memberRole?: Database['public']['Enums']['org_role'];
}) {
  // Assuming you have a hook to get current member role

  // Fetch notifications & unread count
  const { notifications } = useOrgNotifications(organizationId, memberRole);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label='Open notifications'
          size='sm'
          className='hover:bg-muted bg-muted/20 relative'
        >
          <Bell />
          {notifications.length > 0 && (
            <span className='bg-primary absolute top-1 -right-1.5 h-2 w-2 rounded-full' />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className='max-h-96 w-80 overflow-y-auto p-0 md:w-96' align='end'>
        <DropdownMenuLabel className='bg-background sticky top-0 z-10 flex items-center justify-between border-b px-4 py-2 shadow-sm'>
          <div className='flex items-center space-x-2'>
            <Bell size={18} className='text-foreground' />
            <span className='text-foreground font-semibold'>
              Notifications ({notifications.length})
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuGroup className='divide-muted-foreground/10 divide-y shadow-none'>
          {notifications.length === 0 && (
            <DropdownMenuItem className='text-muted-foreground flex cursor-default flex-col items-start px-4 py-2'>
              No notifications
            </DropdownMenuItem>
          )}

          {notifications.map((notif) => (
            <DropdownMenuItem
              key={notif.id}
              className='hover:bg-muted/60 flex cursor-pointer flex-col items-start px-4 py-2'
            >
              <span className='text-foreground/90 text-sm font-medium'>{notif.title}</span>
              <span className='text-muted-foreground text-xs'>{notif.body}</span>
              <div className='text-muted-foreground mt-1 flex items-center text-[11px]'>
                <Clock className='mr-1 h-3 w-3 opacity-70' />
                {new Date(notif.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

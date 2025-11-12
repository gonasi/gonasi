import { Bell, Clock } from 'lucide-react';

import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

export function OrganizationNotifications() {
  const notifications = [
    {
      id: 1,
      title: 'New course enrollment',
      description: 'Alice joined your Driving Basics course',
      time: '2h ago',
    },
    {
      id: 2,
      title: 'Subscription renewed',
      description: 'Gonasi Pro plan renewed successfully',
      time: '4h ago',
    },
    {
      id: 3,
      title: 'New comment',
      description: 'John commented on your lesson "Parallel Parking"',
      time: '6h ago',
    },
    {
      id: 4,
      title: 'Invite accepted',
      description: 'Mark joined your organization as an editor',
      time: '1d ago',
    },
    {
      id: 5,
      title: 'Payment received',
      description: 'You earned $25 from a course sale',
      time: '2d ago',
    },
    {
      id: 6,
      title: 'AI credits low',
      description: 'Only 10 AI credits remaining — top up soon',
      time: '3d ago',
    },
    {
      id: 7,
      title: 'Lesson published',
      description: 'Your lesson "Defensive Driving" is live',
      time: '4d ago',
    },
    {
      id: 8,
      title: 'Collaborator added',
      description: 'Sarah was added as a co-creator',
      time: '5d ago',
    },
    {
      id: 9,
      title: 'Feedback received',
      description: 'New student feedback available',
      time: '1w ago',
    },
    {
      id: 10,
      title: 'New follower',
      description: 'Tom started following your organization',
      time: '1w ago',
    },
  ];

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label='Open notifications'
          size='sm'
          className='hover:bg-muted relative bg-transparent'
        >
          <Bell />
          <span className='bg-primary absolute top-1 -right-1.5 h-2 w-2 rounded-full' />
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

        <DropdownMenuGroup className='divide-muted-foreground/10 divide-y'>
          {notifications.map((notif) => (
            <DropdownMenuItem
              key={notif.id}
              className='hover:bg-muted/60 flex cursor-pointer flex-col items-start px-4 py-2'
            >
              <span className='text-foreground/90 text-sm font-medium'>{notif.title}</span>
              <span className='text-muted-foreground text-xs'>{notif.description}</span>
              <div className='text-muted-foreground mt-1 flex items-center text-[11px]'>
                <Clock className='mr-1 h-3 w-3 opacity-70' />
                {notif.time}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

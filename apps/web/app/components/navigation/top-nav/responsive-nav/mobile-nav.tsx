import * as React from 'react';
import { Link, Menu } from 'lucide-react';

import { AppLogo } from '~/components/app-logo';
import { Button } from '~/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet';

const navigation = [
  { name: 'Dashboard', href: '#' },
  { name: 'Projects', href: '#' },
  { name: 'Team', href: '#' },
  { name: 'Calendar', href: '#' },
  { name: 'Reports', href: '#' },
  { name: 'Settings', href: '#' },
];

export function MobileNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant='ghost' size='icon' className='bg-card/20 px-0 md:hidden'>
          <Menu size={36} />
          <span className='sr-only'>Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side='left' className='w-[300px] sm:w-[400px]'>
        <SheetHeader>
          <SheetTitle>
            <div className='flex'>
              <AppLogo sizeClass='h-6' />
              <span className='mt-0.5 text-lg font-bold'>onasi</span>
            </div>
          </SheetTitle>
        </SheetHeader>
        <nav className='mt-6 flex flex-col gap-4'>
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className='block rounded-md px-3 py-2 text-base font-medium text-gray-900 transition-colors hover:bg-gray-50 hover:text-gray-900'
              onClick={() => setOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

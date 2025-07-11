import * as React from 'react';
import { NavLink, useNavigation } from 'react-router';
import { Menu } from 'lucide-react';

import { AppLogo } from '~/components/app-logo';
import { SideLink } from '~/components/go-sidebar/side-link';
import { Button } from '~/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet';
import type { DashboardLink } from '~/hooks/useDashboardLinks';

interface IMobileNavProps {
  links: DashboardLink[];
}

export function MobileNav({ links }: IMobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const navigation = useNavigation();
  const [wasNavigating, setWasNavigating] = React.useState(false);
  const closeTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // Detect start of navigation
  React.useEffect(() => {
    if (navigation.state !== 'idle') {
      setWasNavigating(true);
    }

    // Once it returns to idle *after* navigating, close the sheet with delay
    if (navigation.state === 'idle' && wasNavigating) {
      closeTimeout.current = setTimeout(() => {
        setOpen(false);
        setWasNavigating(false); // reset
      }, 150);
    }

    return () => {
      if (closeTimeout.current) {
        clearTimeout(closeTimeout.current);
        closeTimeout.current = null;
      }
    };
  }, [navigation.state, wasNavigating]);

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
            <NavLink className='flex' to='/'>
              <AppLogo sizeClass='h-6' />
              <span className='mt-0.5 text-lg font-bold'>onasi</span>
            </NavLink>
          </SheetTitle>
        </SheetHeader>
        <nav className='flex-1 space-y-1 pl-2'>
          {links.map((link) => (
            <SideLink key={link.to} icon={link.icon} to={link.to} name={link.name} forceLabel />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

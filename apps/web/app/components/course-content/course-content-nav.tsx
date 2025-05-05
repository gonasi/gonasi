import { Link } from 'react-router';
import { Menu } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '~/components/ui/sheet/sheet';

// Navigation items - replace with your own
const navItems = [
  { title: 'Home', href: '/' },
  { title: 'About', href: '/about' },
  { title: 'Services', href: '/services' },
  { title: 'Blog', href: '/blog' },
  { title: 'Contact', href: '/contact' },
];

export function CourseContentNav() {
  return (
    <nav className='border-b'>
      <div className='container flex h-16 items-center justify-between px-4'>
        <div className='flex items-center gap-2'>
          <Link to='/' className='font-bold'>
            Brand
          </Link>
        </div>

        {/* Mobile Navigation */}
        <div className='md:hidden'>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant='ghost' size='icon' className='md:hidden'>
                <Menu className='h-5 w-5' />
                <span className='sr-only'>Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side='right'>
              <div className='flex flex-col gap-4 pt-8'>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className='hover:text-primary text-lg font-medium transition-colors'
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Navigation */}
        <div className='hidden md:flex md:items-center md:gap-6'>
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className='hover:text-primary text-sm font-medium transition-colors'
            >
              {item.title}
            </Link>
          ))}
        </div>

        {/* CTA Button - visible only on desktop */}
        <div className='hidden md:block'>
          <Button>Get Started</Button>
        </div>
      </div>
    </nav>
  );
}

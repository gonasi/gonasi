import { Link } from 'react-router';

const navigation = [
  { name: 'Dashboard', href: '#' },
  { name: 'Projects', href: '#' },
  { name: 'Team', href: '#' },
  { name: 'Calendar', href: '#' },
  { name: 'Reports', href: '#' },
  { name: 'Settings', href: '#' },
];

export function DesktopNav() {
  return (
    <nav className='hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col md:border-r md:border-gray-200 md:bg-white md:pt-5 md:pb-4'>
      <div className='flex flex-shrink-0 items-center px-4'>
        <h1 className='text-xl font-bold text-gray-900'>Your App</h1>
      </div>
      <div className='mt-8 flex flex-grow flex-col'>
        <nav className='flex-1 space-y-1 px-2'>
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className='group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900'
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </nav>
  );
}

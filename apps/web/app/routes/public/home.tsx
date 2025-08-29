import { Rocket } from 'lucide-react';

import type { Route } from './+types/home';

import { NavLinkButton } from '~/components/ui/button';
import { useStore } from '~/store';

export function meta() {
  return [
    {
      title: 'Gonasi • Gamified Learning & Interactive Course Builder',
    },
    {
      name: 'description',
      content:
        'Create and share interactive, gamified courses with Gonasi. Engage learners with hands-on experiences and monetize your expertise with ease.',
    },
  ];
}

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

// ✅ Home page
export default function Home() {
  const { isActiveUserProfileLoading, activeUserProfile } = useStore();

  // User is considered logged out if not loading and no active profile
  const isLoggedOut = !isActiveUserProfileLoading && !activeUserProfile;

  return (
    <div>
      <div className='container mx-auto pt-10 pb-16 md:pt-16 md:pb-24'>
        <div className='mx-auto max-w-3xl text-center'>
          <h1 className='font-display animate-enter text-4xl leading-tight md:text-6xl'>
            Gonasi, Learn Smarter. Teach Better. Together.
          </h1>

          <p className='text-muted-foreground font-secondary animate-fade-in mx-auto mt-5 max-w-2xl text-lg md:text-xl'>
            Gonasi is an interactive, gamified learning platform where educators and institutions
            can create, publish, and monetize engaging courses.
          </p>

          {isLoggedOut && (
            <div className='mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row'>
              <NavLinkButton
                size='lg'
                className='hover-scale rounded-full'
                to='/login'
                rightIcon={<Rocket />}
              >
                Start Learning
              </NavLinkButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

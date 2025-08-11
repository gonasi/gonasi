import { Rocket } from 'lucide-react';

import type { Route } from './+types/home';

import { NavLinkButton } from '~/components/ui/button';

export function meta() {
  return [
    {
      title: 'Gonasi • Interactive Course Builder • Gamified Learning Platform',
    },
    {
      name: 'description',
      content:
        'Build • Learn • Grow. Create interactive, gamified courses with Gonasi • Engage learners with modern, hands-on experiences • Monetize your expertise with ease.',
    },
  ];
}

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

// ✅ Home page component
export default function Home() {
  return (
    <div>
      <div className='container mx-auto pt-10 pb-16 md:pt-16 md:pb-24'>
        <div className='mx-auto max-w-3xl text-center'>
          <h1 className='font-display animate-enter text-4xl leading-tight md:text-6xl'>
            Gonasi, Learn smarter. Teach better. Together.
          </h1>
          <p className='text-muted-foreground font-secondary animate-fade-in mx-auto mt-5 max-w-2xl text-lg md:text-xl'>
            An interactive, gamified course platform where educators and institutions create,
            publish, and monetize engaging learning experiences.
          </p>
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
        </div>
      </div>
    </div>
  );
}

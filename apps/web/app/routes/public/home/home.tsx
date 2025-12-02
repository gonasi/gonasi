import type { Route } from './+types/home';
import { Hero } from './components/hero';
import { RealOutcomes } from './components/Outcomes';
import { Problem } from './components/problem';

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
  return (
    <div>
      <Hero />
      <Problem />
      <RealOutcomes />
    </div>
  );
}

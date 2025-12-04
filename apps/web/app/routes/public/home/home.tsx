import type { Route } from './+types/home';
import { FAQ } from './components/faq';
import { Features } from './components/features';
import { FinalCTA } from './components/final-cta';
import { Hero } from './components/hero';
import { HowItWorks } from './components/how-it-works';
import { RealOutcomes } from './components/Outcomes';
import { Problem } from './components/problem';
import { SocialProof } from './components/social-proof';

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
      <Features />
      <HowItWorks />
      <RealOutcomes />
      <SocialProof />
      <FAQ />
      <FinalCTA />
    </div>
  );
}

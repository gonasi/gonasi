import type { Route } from './+types/home';
import { FAQ } from './components/faq';
import { Features } from './components/features';
import { FinalCTA } from './components/final-cta';
import { Hero } from './components/hero';
import { HowItWorks } from './components/how-it-works';
import { RealOutcomes } from './components/Outcomes';
import { Problem } from './components/problem';

import {
  generateMetaTags,
  generateOrganizationSchema,
  generateWebsiteSchema,
  renderStructuredData,
} from '~/utils/seo';

export function meta() {
  const siteUrl = 'https://gonasi.com';

  return generateMetaTags(
    {
      title:
        'Gonasi - Build Interactive Learning Like Brilliant.org | Kahoot Alternative for Creators',
      description:
        'Gonasi empowers creators to build interactive learning experiences like Brilliant.org and Duolingo. The ultimate Kahoot alternative for live gamified experiences with audiences. Create engaging interactive courses, quizzes, and gamified learning apps with our no-code platform. Tools to build interactive learning for educators and organizations.',
      keywords:
        'Gonasi, build interactive learning, tools to build interactive learning, create interactive learning, kahoot alternative, alternative to kahoot, brilliant.org alternative, alternative to brilliant, duolingo alternative, interactive learning platform, gamified learning creator tools, live gamified experiences, interactive quiz builder, course creation platform, no-code learning platform, educational app builder, interactive course builder, gamified quiz platform, audience engagement tools, live learning platform, gonasi app, gonasi course',
      url: siteUrl,
      type: 'website',
    },
    siteUrl,
  );
}

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

// ✅ Home page
export default function Home() {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gonasi.com';

  // Generate structured data for SEO
  const organizationSchema = generateOrganizationSchema(siteUrl);
  const websiteSchema = generateWebsiteSchema(siteUrl);

  return (
    <>
      {/* Structured Data */}
      <script {...renderStructuredData([organizationSchema, websiteSchema])} />

      <div>
        <Hero />
        <Problem />
        <Features />
        <HowItWorks />
        <RealOutcomes />
        <FAQ />
        <FinalCTA />
      </div>
    </>
  );
}

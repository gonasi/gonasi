import type { Route } from './+types/home';
import { FAQ } from './components/faq';
import { Features } from './components/features';
import { FinalCTA } from './components/final-cta';
import { Hero } from './components/hero';
import { HowItWorks } from './components/how-it-works';
import { RealOutcomes } from './components/Outcomes';
import { Problem } from './components/problem';
import { SocialProof } from './components/social-proof';

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
      title: 'Gonasi • Gamified Learning & Interactive Course Builder',
      description:
        'Create and share interactive, gamified courses with Gonasi. Engage learners with hands-on experiences and monetize your expertise with ease.',
      keywords:
        'LMS, learning management system, course builder, gamified learning, interactive courses, online education, e-learning platform, course monetization',
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
        <SocialProof />
        <FAQ />
        <FinalCTA />
      </div>
    </>
  );
}

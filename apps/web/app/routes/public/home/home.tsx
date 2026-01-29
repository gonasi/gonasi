import type { MetaFunction } from 'react-router';

import type { Route } from './+types/home';
import { FAQ } from './components/faq';
import { Features } from './components/features';
import { FinalCTA } from './components/final-cta';
import { Hero } from './components/hero';
import { HowItWorks } from './components/how-it-works';
import { RealOutcomes } from './components/Outcomes';
import { Problem } from './components/problem';

import {
  generateOrganizationSchema,
  generateWebsiteSchema,
  renderStructuredData,
} from '~/utils/seo';

export const meta: MetaFunction = () => {
  const siteUrl = 'https://gonasi.com';
  const title = 'Gonasi – Build Interactive Courses & Gamified Learning Experiences';
  const description =
    'Gonasi is an interactive course builder for creators, educators, and organizations. Build gamified lessons, quizzes, and learning experiences inspired by Brilliant.org and Duolingo. No-code, flexible blocks, full ownership of your content and learners.';

  return [
    // Basic SEO
    { title },
    { name: 'description', content: description },
    {
      name: 'keywords',
      content:
        'Gonasi, interactive course builder, gamified learning platform, build interactive courses, brilliant.org alternative, duolingo alternative, no-code course builder, quiz builder for educators',
    },
    { name: 'robots', content: 'index, follow' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },

    // Canonical
    { tagName: 'link', rel: 'canonical', href: siteUrl },

    // Open Graph
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: siteUrl },
    { property: 'og:site_name', content: 'Gonasi' },
    {
      property: 'og:image',
      content: `${siteUrl}/og-image.png`,
    },

    // Twitter / X
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    {
      name: 'twitter:image',
      content: `${siteUrl}/og-image.png`,
    },
  ];
};

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

import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const domain = new URL(request.url).origin;

  const robotsText = `
User-agent: *
Allow: /
Disallow: /auth/ 
Disallow: /myProfile/
Disallow: /go/
Disallow: /onboarding/
Disallow: /organizations/*/builder/
Disallow: /organizations/*/dashboard/
Disallow: /organizations/*/members/
Disallow: /organizations/*/settings/
Disallow: /organizations/*/financial-activity/
Disallow: /builder/
Disallow: /invites/  
Disallow: /gonasi/
Disallow: /api/

# Allow important public pages
Allow: /public/
Allow: /explore
Allow: /pricing
Allow: /feedback
Allow: /privacy
Allow: /terms-of-service

# Sitemap location
Sitemap: ${domain}/sitemap.xml
  `.trim();

  return new Response(robotsText, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}

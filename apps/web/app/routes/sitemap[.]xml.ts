import type { LoaderFunctionArgs } from 'react-router';

import { createClient } from '~/lib/supabase/supabase.server';

interface SitemapRoute {
  path: string;
  priority: number;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  lastmod?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase } = createClient(request);
  const domain = new URL(request.url).origin;

  // Static public routes from your routes.ts
  const staticRoutes: SitemapRoute[] = [
    // Home
    { path: '/', priority: 1.0, changefreq: 'daily' },
    // Public pages
    { path: '/go/explore', priority: 0.9, changefreq: 'daily' },
    { path: '/go/pricing', priority: 0.8, changefreq: 'weekly' },
    { path: '/go/privacy', priority: 0.5, changefreq: 'monthly' },
    { path: '/go/terms-of-service', priority: 0.5, changefreq: 'monthly' },
  ];

  // Dynamic routes - fetch from database
  const dynamicRoutes: SitemapRoute[] = [];

  try {
    // Fetch published courses
    const { data: publishedCourses } = await supabase
      .from('published_courses')
      .select('id, updated_at')
      .eq('is_published', true)
      .limit(1000); // Limit to prevent sitemap from being too large

    if (publishedCourses) {
      publishedCourses.forEach((course) => {
        dynamicRoutes.push({
          path: `/c/${course.id}`,
          priority: 0.7,
          changefreq: 'weekly',
          lastmod: course.updated_at
            ? new Date(course.updated_at).toISOString().split('T')[0]
            : undefined,
        });
      });
    }

    // Fetch public organizations
    const { data: organizations } = await supabase
      .from('organizations')
      .select('handle, updated_at')
      .eq('is_public', true)
      .limit(1000);

    if (organizations) {
      organizations.forEach((org) => {
        if (org.handle) {
          dynamicRoutes.push({
            path: `/${org.handle}`,
            priority: 0.6,
            changefreq: 'weekly',
            lastmod: org.updated_at
              ? new Date(org.updated_at).toISOString().split('T')[0]
              : undefined,
          });
        }
      });
    }
  } catch (error) {
    // If database fetch fails, continue with static routes only
    console.error('Error fetching dynamic routes for sitemap:', error);
  }

  // Combine all routes
  const allRoutes = [...staticRoutes, ...dynamicRoutes];

  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (route) => `  <url>
    <loc>${domain}${route.path}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
    <lastmod>${route.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400', // Cache for 1 hour, stale for 24h
    },
  });
}

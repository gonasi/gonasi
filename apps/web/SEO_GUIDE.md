# SEO Implementation Guide for Gonasi

## Overview

This guide documents the SEO improvements implemented for the Gonasi LMS platform using React Router 7.

## What's Implemented

### 1. **Sitemap Generation** (`/sitemap.xml`)

**Location:** `app/routes/sitemap[.]xml.ts`

- **Dynamic sitemap** generated from React Router routes
- **Excludes** private routes (auth, user profiles, admin areas)
- **Auto-updates** when new public routes are added
- Uses `@forge42/seo-tools` for React Router 7 compatibility

**Test it:** Visit `https://yourdomain.com/sitemap.xml`

### 2. **Robots.txt** (`/robots.txt`)

**Location:** `app/routes/robots[.]txt.ts`

- **Crawl directives** for search engines
- **Blocks** private areas from indexing
- **Links** to sitemap for easy discovery
- **Caches** for 24 hours

**Test it:** Visit `https://yourdomain.com/robots.txt`

### 3. **SEO Utility Library**

**Location:** `app/utils/seo.ts`

Provides reusable functions for:

#### Meta Tags
- `generateMetaTags()` - Creates comprehensive meta tags including:
  - Basic SEO (title, description, keywords)
  - Open Graph (Facebook, LinkedIn)
  - Twitter Cards
  - Article-specific tags

#### Canonical URLs
- `generateCanonicalLink()` - Prevents duplicate content issues

#### Structured Data (JSON-LD)
- `generateOrganizationSchema()` - Organization markup
- `generateWebsiteSchema()` - Website markup with search action
- `generateCourseSchema()` - Course-specific markup
- `generateBreadcrumbSchema()` - Navigation breadcrumbs
- `renderStructuredData()` - Helper to render JSON-LD scripts

### 4. **Page-Level SEO**

#### Home Page (`/`)
- ✅ Comprehensive meta tags
- ✅ Open Graph tags
- ✅ Twitter Cards
- ✅ Canonical URL
- ✅ Organization schema
- ✅ Website schema with search
- ✅ Keywords optimization

#### Explore Page (`/explore`)
- ✅ Optimized meta tags
- ✅ Canonical URL
- ✅ Social media previews

#### Pricing Page (`/pricing`)
- ✅ Optimized meta tags
- ✅ Canonical URL
- ✅ Social media previews

## How to Add SEO to New Pages

### Basic Implementation

```typescript
import type { Route } from './+types/your-route';
import { generateCanonicalLink, generateMetaTags } from '~/utils/seo';

export function meta({ request }: Route.MetaArgs) {
  const url = new URL(request.url);
  const siteUrl = url.origin;
  const currentUrl = url.href;

  return generateMetaTags(
    {
      title: 'Your Page Title',
      description: 'Your page description',
      keywords: 'keyword1, keyword2, keyword3',
      url: currentUrl,
      type: 'website',
    },
    siteUrl,
  );
}

export function links({ request }: Route.LinksArgs) {
  const url = new URL(request.url);
  return generateCanonicalLink(url.href);
}
```

### With Structured Data

```typescript
import {
  generateMetaTags,
  generateCanonicalLink,
  renderStructuredData,
  generateCourseSchema
} from '~/utils/seo';

export default function CoursePage({ loaderData }: Route.ComponentProps) {
  const courseSchema = generateCourseSchema({
    name: loaderData.course.name,
    description: loaderData.course.description,
    url: loaderData.course.url,
    image: loaderData.course.image,
    provider: 'Gonasi',
    author: loaderData.course.author,
    price: loaderData.course.price,
    currency: 'USD'
  });

  return (
    <>
      <script {...renderStructuredData(courseSchema)} />
      {/* Your content */}
    </>
  );
}
```

## Best Practices

### 1. **Title Tags**
- Keep under 60 characters
- Include brand name: "Page Title • Gonasi"
- Front-load important keywords

### 2. **Meta Descriptions**
- Keep between 120-160 characters
- Include call-to-action
- Accurately describe page content

### 3. **Keywords**
- 5-10 relevant keywords per page
- Focus on user intent
- Include long-tail variations

### 4. **Open Graph Images**
- Minimum 1200x630 pixels
- Place in `/public/assets/images/og/`
- Use descriptive filenames

### 5. **Structured Data**
- Always validate using [Google's Rich Results Test](https://search.google.com/test/rich-results)
- Include all required properties
- Update when content changes

## Testing Your SEO

### 1. **Sitemap Validator**
```bash
# Test locally
curl http://localhost:5173/sitemap.xml

# Test production
curl https://yourdomain.com/sitemap.xml
```

### 2. **Meta Tags Preview**
- [Facebook Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

### 3. **Structured Data Testing**
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org/)

### 4. **Mobile-Friendly Test**
- [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)

### 5. **Page Speed**
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)

## Submission to Search Engines

### Google Search Console
1. Verify your domain
2. Submit sitemap: `https://yourdomain.com/sitemap.xml`
3. Monitor indexing status
4. Check for crawl errors

### Bing Webmaster Tools
1. Verify your domain
2. Submit sitemap
3. Monitor performance

## Performance Optimizations

All SEO routes include proper caching headers:

- **Sitemap:** Updates daily, stale-while-revalidate
- **Robots.txt:** Cached for 24 hours
- **Pages:** Cache with stale-while-revalidate strategy

## Monitoring

### Track These Metrics:
- Organic search traffic (Google Analytics)
- Click-through rates (Search Console)
- Keyword rankings (Ahrefs, SEMrush, etc.)
- Page load speed (PageSpeed Insights)
- Core Web Vitals (Search Console)

### Set Up Alerts For:
- Sitemap errors
- Crawl errors
- Sudden traffic drops
- 404 errors

## Future Enhancements

Consider adding:
- [ ] XML Sitemap index for large sites
- [ ] Video sitemaps for course previews
- [ ] Image sitemaps for thumbnails
- [ ] News sitemaps for blog content
- [ ] Automatic hreflang tags for i18n
- [ ] AMP pages for mobile
- [ ] Rich snippets for courses (ratings, reviews)

## Resources

- [React Router v7 SEO Guide](https://www.nikolailehbr.ink/blog/sitemap-react-router-7)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

## Package Dependencies

```json
{
  "@forge42/seo-tools": "^latest"
}
```

---

**Last Updated:** December 2025
**Maintainer:** Gonasi Development Team

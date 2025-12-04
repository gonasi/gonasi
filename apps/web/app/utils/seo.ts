/**
 * SEO Utilities for Gonasi
 * Provides helpers for meta tags, structured data, and canonical URLs
 */

export interface SEOMetaData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
}

/**
 * Generate comprehensive meta tags for SEO
 */
export function generateMetaTags(data: SEOMetaData, siteUrl: string) {
  const {
    title,
    description,
    keywords,
    image = `${siteUrl}/og-image.png`,
    url = siteUrl,
    type = 'website',
    twitterCard = 'summary_large_image',
    publishedTime,
    modifiedTime,
    author,
    section,
  } = data;

  const metaTags = [
    // Basic meta tags
    { title },
    { name: 'description', content: description },
    ...(keywords ? [{ name: 'keywords', content: keywords }] : []),

    // Open Graph tags
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:url', content: url },
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: 'Gonasi' },

    // Twitter Card tags
    { name: 'twitter:card', content: twitterCard },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },

    // Article-specific tags
    ...(type === 'article' && publishedTime
      ? [{ property: 'article:published_time', content: publishedTime }]
      : []),
    ...(type === 'article' && modifiedTime
      ? [{ property: 'article:modified_time', content: modifiedTime }]
      : []),
    ...(type === 'article' && author ? [{ property: 'article:author', content: author }] : []),
    ...(type === 'article' && section ? [{ property: 'article:section', content: section }] : []),
  ];

  return metaTags;
}

/**
 * Generate canonical link
 */
export function generateCanonicalLink(url: string) {
  return [{ rel: 'canonical', href: url }];
}

/**
 * Organization structured data (JSON-LD)
 */
export function generateOrganizationSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Gonasi',
    description:
      'Create and share interactive, gamified courses. Engage learners with hands-on experiences and monetize your expertise.',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      // Add your social media profiles here
      // 'https://twitter.com/gonasi',
      // 'https://linkedin.com/company/gonasi',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@gonasi.com',
    },
  };
}

/**
 * Website structured data (JSON-LD)
 */
export function generateWebsiteSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Gonasi',
    description:
      'Gamified Learning & Interactive Course Builder. Create engaging courses that truly deliver results.',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/explore?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Course structured data (JSON-LD)
 */
export function generateCourseSchema(course: {
  name: string;
  description: string;
  url: string;
  image: string;
  provider: string | { name: string; url: string };
  author?: string;
  price?: number;
  currency?: string;
  totalChapters?: number;
  totalLessons?: number;
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.description,
    url: course.url,
    image: course.image,
    provider:
      typeof course.provider === 'string'
        ? {
            '@type': 'Organization',
            name: course.provider,
          }
        : {
            '@type': 'Organization',
            name: course.provider.name,
            url: course.provider.url,
          },
  };

  if (course.author) {
    schema.author = {
      '@type': 'Person',
      name: course.author,
    };
  }

  if (course.price !== undefined) {
    schema.offers = {
      '@type': 'Offer',
      price: course.price,
      priceCurrency: course.currency || 'USD',
    };
  }

  // Add course structure information
  if (course.totalChapters !== undefined || course.totalLessons !== undefined) {
    const educationalUse = [];
    if (course.totalChapters !== undefined) {
      educationalUse.push(`${course.totalChapters} chapters`);
    }
    if (course.totalLessons !== undefined) {
      educationalUse.push(`${course.totalLessons} lessons`);
    }
    schema.hasCourseInstance = {
      '@type': 'CourseInstance',
      courseMode: 'online',
      educationalUse: educationalUse.join(', '),
    };
  }

  return schema;
}

/**
 * Breadcrumb structured data (JSON-LD)
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[], siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.url}`,
    })),
  };
}

/**
 * Render JSON-LD script tag
 */
export function renderStructuredData(data: Record<string, unknown> | Record<string, unknown>[]) {
  return {
    type: 'application/ld+json' as const,
    children: JSON.stringify(data),
  };
}

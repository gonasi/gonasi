import type { Route } from './+types/home';

export function meta() {
  return [
    {
      title: 'Gonasi - Explore Interactive Courses',
    },
    {
      name: 'description',
      content:
        'Discover and explore a variety of interactive online courses on Gonasi. Engage with dynamic content, challenges, and personalized learning experiences.',
    },
    {
      name: 'keywords',
      content:
        'Gonasi, explore courses, interactive learning, online courses, e-learning platform, course discovery, no-code courses',
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      name: 'author',
      content: 'Gonasi Team',
    },
    {
      property: 'og:title',
      content: 'Gonasi - Explore Interactive Courses',
    },
    {
      property: 'og:description',
      content:
        'Browse and discover engaging interactive courses designed to boost your learning experience on Gonasi.',
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:url',
      content: 'https://gonasi.com/go/explore',
    },
    {
      property: 'og:image',
      content: 'https://gonasi.com/assets/images/seo/logo.png',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:title',
      content: 'Gonasi - Explore Interactive Courses',
    },
    {
      name: 'twitter:description',
      content:
        'Discover dynamic, interactive courses on Gonasi to elevate your learning experience.',
    },
    {
      name: 'twitter:image',
      content: 'https://gonasi.com/assets/images/seo/logo.png',
    },
  ];
}

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

export default function Explore() {
  return <h2>explore page</h2>;
}

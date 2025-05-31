import type { Route } from './+types/home';

export function meta() {
  return [
    {
      title: 'Gonasi - Interactive Course Builder',
    },
    {
      name: 'description',
      content:
        'Build and manage interactive online courses with Gonasi — the modern, user-friendly course builder platform.',
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

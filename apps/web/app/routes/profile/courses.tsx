import type { Route } from './+types/profile';

export function meta({ params }: Route.MetaArgs) {
  const username = params.username;
  return [
    {
      title: `Courses by ${username} | Gonasi`,
    },
    {
      name: 'description',
      content: `Explore ${username}'s interactive courses on Gonasi — including published content and in-progress lessons.`,
    },
  ];
}

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

export default function Courses() {
  return (
    <div>
      <h2>Courses go here</h2>
    </div>
  );
}

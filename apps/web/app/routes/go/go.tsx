import type { Route } from './+types/go';

export const metadata = {
  title: 'Gonasi - Interactive Course Builder',
  description: 'Build interactive courses with Gonasi - The modern course builder platform',
};

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

export default function Home() {
  return <h2>Go Home</h2>;
}

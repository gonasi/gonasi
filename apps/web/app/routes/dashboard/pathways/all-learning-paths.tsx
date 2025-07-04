import { fetchLearningPathsWithSignedUrls } from '@gonasi/database/learningPaths';
import { getUserProfile } from '@gonasi/database/profile';

import type { Route } from './+types/all-learning-paths';

import { NotFoundCard } from '~/components/cards';
import { PathwaysCard } from '~/components/cards/pathways-card';
import { ViewLayout } from '~/components/layouts/view/ViewLayout';
import { PaginationBar } from '~/components/search-params/pagination-bar/paginatinon-bar';
import { SearchInput } from '~/components/search-params/search-input';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [
    { title: 'Learning Pathways • Gonasi' },
    {
      name: 'description',
      content:
        'Explore structured learning pathways on Gonasi. Enhance your skills with curated courses, expert guidance, and interactive lessons.',
    },
    {
      name: 'keywords',
      content: 'learning pathways, online courses, skill development, education, Gonasi',
    },
    { property: 'og:title', content: 'Learning Pathways • Gonasi' },
    {
      property: 'og:description',
      content:
        'Discover tailored learning experiences with Gonasi. Follow structured pathways to boost your knowledge and career.',
    },
    { property: 'og:type', content: 'website' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { user } = await getUserProfile(supabase);

  if (!user) {
    throw new Response('Unauthorized access: No server session found', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('name') || '';
  const page = Number(searchParams.get('page')) || 1;
  const limit = 12;

  const pathways = await fetchLearningPathsWithSignedUrls({
    supabase,
    searchQuery,
    limit,
    page,
  });

  return pathways;
}

export default function AllLearningPaths({ loaderData, params }: Route.ComponentProps) {
  const { data, count } = loaderData;

  return (
    <ViewLayout
      title='Learning paths'
      newLink={`/dashboard/${params.companyId}/learning-paths/new`}
    >
      <div className='pb-4'>
        <SearchInput placeholder='Search for learning paths...' />
      </div>

      {data && data.length ? (
        <div className='flex flex-col space-y-4'>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {data.map((pathway) => (
              <PathwaysCard
                key={pathway.id}
                title={pathway.name}
                description={pathway.description}
                iconUrl={pathway.signed_url}
                courseCount={pathway.course_count ?? 0}
                to={`/dashboard/${params.companyId}/learning-paths/${pathway.id}`}
              />
            ))}
          </div>
          <PaginationBar totalItems={count ?? 0} itemsPerPage={12} />
        </div>
      ) : (
        <NotFoundCard message='No learning paths found' />
      )}
    </ViewLayout>
  );
}

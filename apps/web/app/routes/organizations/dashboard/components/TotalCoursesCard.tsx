import { useEffect } from 'react';
import { useFetcher, useParams } from 'react-router';
import { BookOpen } from 'lucide-react';

import { StatsCard } from '~/components/cards';
import { useIsPending } from '~/utils/misc';

export function TotalCoursesCard() {
  const fetcher = useFetcher();
  const params = useParams();
  const isPending = useIsPending();

  useEffect(() => {
    if (fetcher.state === 'idle' && !fetcher.data) {
      fetcher.load(`/api/dashboard/fetch-total-courses-stats/${params.organizationId}`);
    }
  }, [fetcher, params.organizationId]);

  const isLoading = fetcher.state === 'loading' || fetcher.state === 'submitting' || isPending;

  const result = fetcher.data as { success: boolean; message: string; data: any } | undefined;

  const hasError = result && !result.success;
  const data = result?.data;

  // 🧮 Pluralization
  const drafts = data?.unpublished_courses ?? 0;
  const published = data?.published_courses ?? 0;
  const draftLabel = drafts === 1 ? 'draft' : 'drafts';
  const publishedLabel = published === 1 ? 'published' : 'published';

  // 🚫 Avoid showing stale/default data before fetch completes
  if (isLoading || !result) {
    return <StatsCard isLoading title='Total Courses' value='—' icon={BookOpen} />;
  }

  return (
    <StatsCard
      title='Total Courses'
      value={data?.total_courses ?? 0}
      description={`${drafts} ${draftLabel}, ${published} ${publishedLabel}`}
      icon={BookOpen}
      trend={{
        value: `${data?.percent_growth ?? 0}%`,
        positive: (data?.percent_growth ?? 0) >= 0,
      }}
      isLoading={isLoading}
      error={hasError ? result?.message : null}
    />
  );
}

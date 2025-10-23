import { useEffect } from 'react';
import { useFetcher, useParams } from 'react-router';
import { Users } from 'lucide-react';

import type { FetchTotalStudentsStatsResult } from '@gonasi/database/dashboard';

import { StatsCard } from '~/components/cards';
import { useIsPending } from '~/utils/misc';

export function TotalStudentsCard() {
  const fetcher = useFetcher();
  const { organizationId } = useParams();
  const isPending = useIsPending();

  const isLoading = fetcher.state === 'loading' || fetcher.state === 'submitting' || isPending;

  useEffect(() => {
    if (fetcher.state === 'idle' && !fetcher.data && organizationId) {
      fetcher.load(`/api/dashboard/fetch-total-students-stats/${organizationId}`);
    }
  }, [fetcher, organizationId]);

  const result = fetcher.data as FetchTotalStudentsStatsResult | undefined;
  const hasError = result && !result.success;
  const data = result?.data;

  // Avoid showing stale/default data before fetch completes
  if (isLoading || !result) {
    return <StatsCard title='Total Students' value='—' icon={Users} isLoading />;
  }

  return (
    <StatsCard
      title='Total Students'
      value={data?.total_students ?? 0}
      description='Across all courses'
      icon={Users}
      trend={{
        value: `${data?.percent_growth ?? 0}%`,
        positive: (data?.percent_growth ?? 0) >= 0,
      }}
      isLoading={isLoading}
      error={hasError ? result.message : null}
    />
  );
}

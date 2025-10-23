import { useEffect } from 'react';
import { useFetcher, useParams } from 'react-router';
import { Users } from 'lucide-react';

import type { FetchTotalEnrollmentStatsResult } from '@gonasi/database/dashboard';

import { StatsCard } from '~/components/cards';
import { useIsPending } from '~/utils/misc';

export function TotalEnrollmentsCard() {
  const fetcher = useFetcher();
  const { organizationId } = useParams();
  const isPending = useIsPending();

  const isLoading = fetcher.state === 'loading' || fetcher.state === 'submitting' || isPending;

  // Fetch only once on mount when idle
  useEffect(() => {
    if (fetcher.state === 'idle' && !fetcher.data && organizationId) {
      fetcher.load(`/api/dashboard/fetch-total-course-enrollment-stats/${organizationId}`);
    }
  }, [fetcher, organizationId]);

  const result = fetcher.data as FetchTotalEnrollmentStatsResult | undefined;
  const hasError = result && !result.success;
  const data = result?.data;

  if (isLoading || !result) {
    return <StatsCard title='Total Enrollments' value='—' icon={Users} isLoading />;
  }

  const percentGrowth = data?.percent_growth ?? 0;
  const thisMonth = data?.this_month_new_enrollments ?? 0;
  const lastMonth = data?.last_month_new_enrollments ?? 0;
  const difference = thisMonth - lastMonth;

  return (
    <StatsCard
      title='Total Enrollments'
      value={data?.total_enrollments ?? 0}
      description={`All-time enrollments • Active: ${data?.active_enrollments ?? 0}`}
      icon={Users}
      trend={{
        value: `${percentGrowth.toFixed(2)}%`,
        difference,
        positive: percentGrowth >= 0,
      }}
      trendExplanation='new enrollments'
      isLoading={isLoading}
      error={hasError ? result.message : null}
    />
  );
}

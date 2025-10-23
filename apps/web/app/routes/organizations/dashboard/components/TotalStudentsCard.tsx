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

  if (isLoading || !result) {
    return <StatsCard title='Total Students' value='—' icon={Users} isLoading />;
  }

  return (
    <StatsCard
      title='Total Students'
      value={data?.total_unique_students ?? 0}
      displayUi={
        <div className='bg-primary/10 flex gap-4 rounded-sm p-2'>
          <div>
            <p className='text-foreground text-2xl font-bold'>{data?.active_students}</p>
            <p className='text-muted-foreground text-xs'>active</p>
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>This month</p>
            <p className='text-foreground text-xl font-semibold'>{data?.this_month_enrollments}</p>
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Last month</p>
            <p className='text-foreground text-xl font-semibold'>{data?.last_month_enrollments}</p>
          </div>
        </div>
      }
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

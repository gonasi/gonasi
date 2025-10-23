import { useEffect } from 'react';
import { useFetcher, useParams } from 'react-router';
import { RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';

import type { FetchReEnrollmentStatsResult } from '@gonasi/database/dashboard';

import { StatsCard } from '~/components/cards';
import { cn } from '~/lib/utils';
import { useIsPending } from '~/utils/misc';

export function TotalReEnrollmentsCard() {
  const fetcher = useFetcher();
  const { organizationId } = useParams();
  const isPending = useIsPending();

  const isLoading = fetcher.state === 'loading' || fetcher.state === 'submitting' || isPending;

  useEffect(() => {
    if (fetcher.state === 'idle' && !fetcher.data && organizationId) {
      fetcher.load(`/api/dashboard/fetch-total-course-re-enrollment-stats/${organizationId}`);
    }
  }, [fetcher, organizationId]);

  const result = fetcher.data as FetchReEnrollmentStatsResult | undefined;
  const hasError = result && !result.success;
  const data = result?.data;

  // Compact number formatter (K, M, etc.)
  const formatNumber = (num?: number | string) => {
    if (num == null || isNaN(Number(num))) return '—';
    return new Intl.NumberFormat('en', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(Number(num));
  };

  if (isLoading || !result) {
    return <StatsCard title='Total Course Re-Enrollments' value='—' icon={RefreshCw} isLoading />;
  }

  return (
    <StatsCard
      title='Total Course Re-Enrollments'
      value={formatNumber(data?.total_re_enrollments)}
      displayUi={
        <div
          className={cn(
            'flex items-center gap-4 rounded-lg p-2',
            data
              ? data.this_month_re_enrollments > data.last_month_re_enrollments
                ? 'bg-success/10'
                : 'bg-danger/10'
              : '',
          )}
        >
          {/* This month new enrollments */}
          <div className='flex items-center gap-1'>
            <div>
              <p className='text-muted-foreground font-secondary text-xs'>This month</p>
              <p className='text-foreground text-xl font-semibold'>
                {formatNumber(data?.this_month_re_enrollments)}
              </p>
            </div>
            {data && data?.this_month_re_enrollments > data?.last_month_re_enrollments ? (
              <TrendingUp className='text-success h-4 w-4' />
            ) : data && data?.this_month_re_enrollments < data?.last_month_re_enrollments ? (
              <TrendingDown className='text-danger h-4 w-4' />
            ) : null}
          </div>

          {/* Last month new enrollments */}
          <div>
            <p className='text-muted-foreground font-secondary text-xs'>Last month</p>
            <p className='text-foreground text-xl font-semibold'>
              {formatNumber(data?.last_month_re_enrollments)}
            </p>
          </div>
        </div>
      }
      icon={RefreshCw}
      trend={{
        value: `${data?.percent_growth ?? 0}%`,
        positive: (data?.percent_growth ?? 0) >= 0,
      }}
      isLoading={isLoading}
      error={hasError ? result.message : null}
    />
  );
}

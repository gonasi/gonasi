import { useEffect } from 'react';
import { useFetcher, useParams } from 'react-router';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  DollarSign,
  Minus,
  Percent,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import type { OrganizationWalletBalancesResult } from '@gonasi/database/dashboard';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { cn } from '~/lib/utils';
import { useIsPending } from '~/utils/misc';

// -----------------------------------------------------------------------------
// Trend Badge
// -----------------------------------------------------------------------------
function TrendBadge({
  trend,
  change,
  percentage,
  currency,
}: {
  trend: string;
  change: number;
  percentage: number;
  currency: string;
}) {
  const isUp = trend === 'increased';
  const isDown = trend === 'decreased';
  const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;
  const bg = isUp ? 'bg-emerald-50' : isDown ? 'bg-red-50' : 'bg-gray-50';
  const color = isUp ? 'text-emerald-700' : isDown ? 'text-red-700' : 'text-gray-700';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        bg,
        color,
      )}
    >
      <Icon className='h-3.5 w-3.5' />
      <span>
        {isUp && '+'}
        {isDown && '-'}
        {currency} {Math.abs(change).toLocaleString()} ({percentage.toFixed(1)}%)
      </span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Stat Card
// -----------------------------------------------------------------------------
function StatCard({
  label,
  value,
  currency,
  icon: Icon,
  trend,
}: {
  label: string;
  value: number;
  currency: string;
  icon: React.ElementType;
  trend?: React.ReactNode;
}) {
  return (
    <div className='group bg-card/50 md:bg-background/50 relative overflow-hidden rounded-none border-none p-4 transition-all'>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <p className='text-muted-foreground font-secondary text-sm font-medium'>{label}</p>
          <p className='mt-2 text-2xl font-bold tabular-nums'>
            {currency} {value.toLocaleString()}
          </p>
        </div>
        <div className='from-primary/10 to-primary/20 rounded-lg bg-gradient-to-br p-2'>
          <Icon className='text-primary h-5 w-5' />
        </div>
      </div>
      {trend && <div className='mt-3'>{trend}</div>}
    </div>
  );
}

function FinancialSummarySkeleton() {
  return (
    <div className='md:bg-card mx-auto animate-pulse space-y-4 bg-transparent p-0 md:p-4'>
      {/* Tabs Skeleton */}
      <div className='flex gap-2 rounded-lg p-1'>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className='bg-muted/50 h-8 w-20 rounded-md' />
        ))}
      </div>

      {/* Wallet TabsContent Skeleton */}
      <div className='space-y-6 pt-4'>
        {/* Stat Cards Grid */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className='group bg-card/50 md:bg-background/50 relative overflow-hidden rounded-none border-none p-4'
            >
              {/* Label + Icon */}
              <div className='flex items-start justify-between'>
                <div className='flex-1 space-y-2'>
                  <div className='bg-muted/50 h-3 w-24 rounded' />
                  <div className='bg-muted/50 h-6 w-32 rounded' />
                </div>
                <div className='bg-muted/30 rounded-lg p-2'>
                  <div className='bg-muted/50 h-5 w-5 rounded' />
                </div>
              </div>

              {/* Trend badge */}
              <div className='bg-muted/50 mt-3 h-5 w-40 rounded' />
            </div>
          ))}
        </div>

        {/* Metrics Section */}
        <div className='bg-background/50 overflow-hidden rounded-none'>
          <div className='space-y-2 p-0 md:p-4'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='group flex items-center justify-between rounded-lg p-3'>
                <div className='flex items-center gap-3'>
                  <div className='bg-muted/30 rounded-lg p-2'>
                    <div className='bg-muted/50 h-4 w-4 rounded' />
                  </div>
                  <div className='bg-muted/50 h-3 w-32 rounded' />
                </div>
                <div className='bg-muted/50 h-3 w-20 rounded' />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Metric Item
// -----------------------------------------------------------------------------
function MetricItem({
  label,
  value,
  currency,
  icon: Icon,
  highlighted,
}: {
  label: string;
  value: number;
  currency: string;
  icon: React.ElementType;
  highlighted?: boolean;
}) {
  const bg = highlighted ? 'bg-card/50' : '';
  const iconBg = highlighted ? 'bg-blue-100' : 'bg-gray-100';
  const iconColor = highlighted ? 'text-blue-600' : 'text-gray-600';

  return (
    <div
      className={cn('group flex items-center justify-between rounded-lg p-3 transition-colors', bg)}
    >
      <div className='flex items-center gap-3'>
        <div className={cn('rounded-lg p-2', iconBg)}>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>
        <span className='text-sm font-medium'>{label}</span>
      </div>
      <span className='text-sm font-semibold tabular-nums'>
        {currency} {value.toLocaleString()}
      </span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Financial Summary
// -----------------------------------------------------------------------------
export function FinancialSummary() {
  const fetcher = useFetcher();
  const { organizationId } = useParams();
  const isPending = useIsPending();

  const isLoading = fetcher.state === 'loading' || fetcher.state === 'submitting' || isPending;

  useEffect(() => {
    if (fetcher.state === 'idle' && !fetcher.data && organizationId) {
      fetcher.load(`/api/dashboard/fetch-organization-wallet-balance/${organizationId}`);
    }
  }, [fetcher, organizationId]);

  const result = fetcher.data as OrganizationWalletBalancesResult | undefined;
  const hasError = result && !result.success;
  const wallets = result?.data ?? [];

  if (isLoading) {
    return <FinancialSummarySkeleton />;
  }

  if (hasError) {
    return (
      <div className='flex items-center gap-2 p-6 text-red-600'>
        <AlertCircle className='h-5 w-5' />
        {result?.message ?? 'Failed to load financial summary.'}
      </div>
    );
  }

  return (
    <div className='md:bg-card mx-auto space-y-4 bg-transparent p-0 md:p-4'>
      <Tabs defaultValue={wallets[0]?.currency_code || 'USD'}>
        <TabsList className='rounded-lg p-1'>
          {wallets.map((wallet) => (
            <TabsTrigger
              key={wallet.currency_code}
              value={wallet.currency_code}
              className='data-[state=active]:bg-background/50 rounded-md px-4 py-2 text-sm font-semibold transition-all hover:cursor-pointer data-[state=active]:shadow-sm'
            >
              {wallet.currency_code}
            </TabsTrigger>
          ))}
        </TabsList>

        {wallets.map((wallet) => (
          <TabsContent
            key={wallet.currency_code}
            value={wallet.currency_code}
            className='space-y-6 pt-4'
          >
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              <StatCard
                label='Net Earnings'
                value={wallet.net_earnings}
                currency={wallet.currency_code}
                icon={DollarSign}
                trend={
                  <TrendBadge
                    trend={wallet.trend}
                    change={wallet.month_over_month_change}
                    percentage={wallet.month_over_month_percentage_change}
                    currency={wallet.currency_code}
                  />
                }
              />
              <StatCard
                label='Available Balance'
                value={wallet.balance_available}
                currency={wallet.currency_code}
                icon={Wallet}
              />
              <StatCard
                label='Current Month'
                value={wallet.current_month_earnings}
                currency={wallet.currency_code}
                icon={TrendingUp}
              />
            </div>

            <div className='bg-background/50 overflow-hidden rounded-none'>
              <div className='space-y-2 p-0 md:p-4'>
                <MetricItem
                  label='Gross Earnings'
                  value={wallet.gross_earnings}
                  currency={wallet.currency_code}
                  icon={Coins}
                  highlighted
                />
                <MetricItem
                  label='Total Fees'
                  value={wallet.total_fees}
                  currency={wallet.currency_code}
                  icon={Percent}
                />
                <MetricItem
                  label='Total Balance'
                  value={wallet.balance_total}
                  currency={wallet.currency_code}
                  icon={Wallet}
                  highlighted
                />
                <MetricItem
                  label='Reserved Balance'
                  value={wallet.balance_reserved}
                  currency={wallet.currency_code}
                  icon={Wallet}
                />
                <MetricItem
                  label='Previous Month'
                  value={wallet.previous_month_earnings}
                  currency={wallet.currency_code}
                  icon={TrendingDown}
                />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

import { useEffect } from 'react';
import { useFetcher, useNavigate, useParams } from 'react-router';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Coins,
  DollarSign,
  Minus,
  Percent,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import type { OrganizationWalletBalancesResult } from '@gonasi/database/dashboard';

import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { cn } from '~/lib/utils';
import { useIsPending } from '~/utils/misc';

// -----------------------------------------------------------------------------
// Skeleton Loader
// -----------------------------------------------------------------------------
function EarningsSkeleton() {
  return (
    <div className='animate-pulse space-y-6'>
      {/* Header Section */}
      <div className='flex items-start justify-between'>
        <div className='flex-1 space-y-2'>
          <div className='bg-muted h-4 w-32 rounded' />
          <div className='bg-muted h-8 w-44 rounded' />
          <div className='bg-muted h-3 w-28 rounded' />
          <div className='bg-muted h-4 w-40 rounded' />
        </div>
        <div className='bg-muted h-12 w-12 rounded-lg' />
      </div>

      <div className='bg-border/50 h-px w-full' />

      <div className='grid grid-cols-2 gap-3 md:grid-cols-3'>
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className='bg-card/30 flex items-center justify-between rounded-md border px-3 py-2'
          >
            <div className='flex items-center gap-2'>
              <div className='bg-muted h-4 w-4 rounded' />
              <div className='bg-muted h-3 w-20 rounded' />
            </div>
            <div className='bg-muted h-4 w-16 rounded' />
          </div>
        ))}
      </div>

      <div className='flex justify-end gap-3'>
        <div className='bg-muted h-8 w-32 rounded-md' />
        <div className='bg-muted h-8 w-28 rounded-md' />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Trend Indicator
// -----------------------------------------------------------------------------
function TrendIndicator({
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
  const color = isUp ? 'text-success' : isDown ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className='flex items-center gap-1'>
      <Icon className={cn('h-4 w-4', color)} />
      <span className={cn('text-xs font-medium', color)}>
        {isUp && '+'}
        {isDown && '-'}
        {currency} {Math.abs(change).toLocaleString()} ({percentage.toFixed(1)}%)
      </span>
      <span className='text-muted-foreground text-xs'>this month</span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Metric Display
// -----------------------------------------------------------------------------
function Metric({
  label,
  value,
  currency,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: number;
  currency: string;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <div className='bg-card/30 flex items-center justify-between rounded-md border px-3 py-2'>
      <div className='flex items-center gap-2'>
        <Icon className='text-muted-foreground h-4 w-4' />
        <p className='text-muted-foreground text-xs'>{label}</p>
      </div>
      <p
        className={cn(
          'text-sm font-semibold',
          highlight ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {currency} {value.toLocaleString()}
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------
export function TotalEarningsCard() {
  const fetcher = useFetcher();
  const { organizationId } = useParams();
  const navigate = useNavigate();
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

  return (
    <Card className='border-border/50 rounded-none'>
      <CardContent className='p-6'>
        <Tabs defaultValue={wallets[0]?.currency_code || 'USD'}>
          <div className='mb-4 flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Organization Earnings</h3>
            <TabsList>
              {wallets.map((wallet) => (
                <TabsTrigger key={wallet.currency_code} value={wallet.currency_code}>
                  {wallet.currency_code}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {hasError && (
            <div className='text-destructive mt-4 flex items-center gap-2 text-sm'>
              <AlertCircle className='h-4 w-4' />
              {result?.message ?? 'Failed to load wallet balances.'}
            </div>
          )}

          {isLoading && !hasError && (
            <TabsContent value={wallets[0]?.currency_code || 'USD'}>
              <EarningsSkeleton />
            </TabsContent>
          )}

          {!isLoading &&
            !hasError &&
            wallets.map((wallet) => (
              <TabsContent key={wallet.currency_code} value={wallet.currency_code}>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <p className='text-muted-foreground mb-1 text-sm font-medium'>Net Earnings</p>
                    <h3 className='text-foreground mb-2 text-3xl font-bold'>
                      {wallet.currency_code} {wallet.net_earnings.toLocaleString()}
                    </h3>
                    <p className='text-muted-foreground text-sm'>After all fees and deductions</p>
                    <div className='mt-2'>
                      <TrendIndicator
                        trend={wallet.trend}
                        change={wallet.month_over_month_change}
                        percentage={wallet.month_over_month_percentage_change}
                        currency={wallet.currency_code}
                      />
                    </div>
                  </div>

                  <div className='bg-success/10 flex h-12 w-12 items-center justify-center rounded-lg'>
                    <DollarSign className='text-success h-6 w-6' />
                  </div>
                </div>

                <div className='border-border/50 my-4 border-t' />

                <div className='mb-6 grid grid-cols-2 gap-3 md:grid-cols-3'>
                  {/* --- Balances --- */}
                  <Metric
                    label='Available Balance'
                    value={wallet.balance_available}
                    currency={wallet.currency_code}
                    icon={Wallet}
                    highlight
                  />
                  <Metric
                    label='Reserved Balance'
                    value={wallet.balance_reserved}
                    currency={wallet.currency_code}
                    icon={Wallet}
                  />
                  <Metric
                    label='Total Balance'
                    value={wallet.balance_total}
                    currency={wallet.currency_code}
                    icon={Wallet}
                  />

                  {/* --- Earnings --- */}
                  <Metric
                    label='Gross Earnings'
                    value={wallet.gross_earnings}
                    currency={wallet.currency_code}
                    icon={Coins}
                    highlight
                  />
                  <Metric
                    label='Total Fees'
                    value={wallet.total_fees}
                    currency={wallet.currency_code}
                    icon={Percent}
                  />
                  <Metric
                    label='Net Earnings'
                    value={wallet.net_earnings}
                    currency={wallet.currency_code}
                    icon={DollarSign}
                  />

                  {/* --- Monthly --- */}
                  <Metric
                    label='Current Month Earnings'
                    value={wallet.current_month_earnings}
                    currency={wallet.currency_code}
                    icon={TrendingUp}
                    highlight
                  />
                  <Metric
                    label='Previous Month Earnings'
                    value={wallet.previous_month_earnings}
                    currency={wallet.currency_code}
                    icon={TrendingDown}
                  />
                  <Metric
                    label='Month-over-Month Change'
                    value={wallet.month_over_month_change}
                    currency={wallet.currency_code}
                    icon={ArrowUpRight}
                  />
                </div>

                <div className='flex items-center justify-end gap-3'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      navigate(
                        `/dashboard/${organizationId}/ledger?currency=${wallet.currency_code}`,
                      )
                    }
                  >
                    <Receipt className='mr-1.5 h-4 w-4' />
                    View Full Ledger
                  </Button>

                  {wallet.balance_available > 0 && (
                    <Button
                      variant='success'
                      size='sm'
                      onClick={() =>
                        navigate(`/dashboard/${organizationId}/withdraw?wallet=${wallet.wallet_id}`)
                      }
                    >
                      <Banknote className='mr-1.5 h-4 w-4' />
                      Withdraw
                    </Button>
                  )}
                </div>
              </TabsContent>
            ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

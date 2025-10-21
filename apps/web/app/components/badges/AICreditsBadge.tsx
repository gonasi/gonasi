import { type ReactNode, useEffect, useState } from 'react';
import { NavLink, type NavLinkProps, useFetcher, useParams } from 'react-router';
import { motion } from 'framer-motion';
import { Loader2, RefreshCcw, Zap } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';
import { useIsPending } from '~/utils/misc';

interface AICreditsBadgeProps {
  to: NavLinkProps['to'];
  className?: string;
  tooltipLabel?: ReactNode | string;
}

export function AICreditsBadge({
  to,
  className,
  tooltipLabel = 'AI credits left',
}: AICreditsBadgeProps) {
  const [mounted, setMounted] = useState(false);
  const fetcher = useFetcher();
  const params = useParams();
  const isPending = useIsPending();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && fetcher.state === 'idle' && !fetcher.data) {
      fetcher.load(`/api/fetch-organization-available-credits/${params.organizationId}`);
    }
  }, [mounted, fetcher, params.organizationId]);

  if (!mounted) return null;

  const credits = fetcher.data?.credits ?? null;

  // Normalize numbers (handle nulls/strings)
  const toNum = (v: unknown) => {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const totalAvailable = toNum(credits?.total_available_credits);
  const baseRemaining = toNum(credits?.base_credits_remaining);
  const purchasedRemaining = toNum(credits?.purchased_credits_remaining);

  // Determine a sensible "maxCredits"
  // 1) If we can derive base+purchased (likely the intended max when only remaining fields are returned), use that if > 0
  // 2) Else fall back to total_available (so we treat available as full when we can't infer a max)
  // This avoids false "low" warnings when the API doesn't provide total caps.
  const derivedMax = baseRemaining + purchasedRemaining;
  const maxCredits = derivedMax > 0 ? derivedMax : totalAvailable;

  const creditsLeft = totalAvailable; // API gives this as the available remaining credits
  const isLoading = fetcher.state === 'loading' || isPending;

  // Compact number formatter
  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toString();
  };

  // Only compute percentage when maxCredits > 0
  const percentage = maxCredits > 0 ? (creditsLeft / maxCredits) * 100 : 100;

  // Only mark low when we actually have a meaningful max to compare against
  const isEmpty = creditsLeft <= 0;
  const isLow = !isEmpty && maxCredits > 0 && percentage < 20;

  const getThemeClasses = () => {
    if (isEmpty) {
      return {
        bg: 'bg-destructive/10',
        text: 'text-destructive',
        border: 'border-destructive/20',
      };
    }
    if (isLow) {
      return {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-600 dark:text-yellow-500',
        border: 'border-yellow-500/20',
      };
    }
    return {
      bg: 'bg-primary/10',
      text: 'text-primary',
      border: 'border-primary/20',
    };
  };

  const { bg, text, border } = getThemeClasses();

  const handleRefresh = () => {
    fetcher.load(`/api/fetch-organization-available-credits/${params.organizationId}`);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 250, damping: 18 }}
          >
            <NavLink to={to}>
              {({ isPending }) => (
                <span
                  className={cn(
                    'inline-flex flex-col items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 sm:flex-row sm:gap-2',
                    bg,
                    text,
                    border,
                    'text-center hover:opacity-90',
                    (isPending || isLoading) && 'animate-pulse',
                    className,
                  )}
                >
                  <div className='flex items-center gap-2'>
                    <Zap className='h-4 w-4' />
                    {isLoading ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      // If maxCredits is 0 we show only creditsLeft (avoid "0/0")
                      <span>
                        {formatNumber(creditsLeft)}
                        {maxCredits > 0 ? ` / ${formatNumber(maxCredits)}` : ''}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRefresh();
                    }}
                    disabled={isLoading}
                    className='transition-opacity hover:opacity-70 disabled:opacity-50'
                    aria-label='Refresh credits'
                  >
                    {isLoading ? (
                      <Loader2 className='h-3 w-3 animate-spin' />
                    ) : (
                      <RefreshCcw className='h-3 w-3' />
                    )}
                  </button>
                </span>
              )}
            </NavLink>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side='top'>
          <p>{tooltipLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

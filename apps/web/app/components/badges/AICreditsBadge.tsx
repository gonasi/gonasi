import { type ReactNode, useEffect, useState } from 'react';
import { NavLink, type NavLinkProps } from 'react-router';
import { motion } from 'framer-motion';
import { Loader2, RefreshCcw, Zap } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';

interface AICreditsBadgeProps {
  to: NavLinkProps['to'];
  creditsLeft?: number;
  maxCredits?: number;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
  tooltipLabel?: ReactNode | string;
}

export function AICreditsBadge({
  to,
  creditsLeft = 0,
  maxCredits = 1000,
  isLoading = false,
  onRefresh,
  className,
  tooltipLabel = 'AI credits left',
}: AICreditsBadgeProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // Compact formatter: 1,200 → 1.2k
  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toString();
  };

  const percentage = (creditsLeft / maxCredits) * 100;
  const isLow = percentage < 20;
  const isEmpty = creditsLeft === 0;

  const getBgColor = () => {
    if (isEmpty) return 'bg-destructive/10';
    if (isLow) return 'bg-yellow-500/10';
    return 'bg-primary/10';
  };

  const getTextColor = () => {
    if (isEmpty) return 'text-destructive';
    if (isLow) return 'text-yellow-600 dark:text-yellow-500';
    return 'text-primary';
  };

  const getBorderColor = () => {
    if (isEmpty) return 'border-destructive/20';
    if (isLow) return 'border-yellow-500/20';
    return 'border-primary/20';
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
                    getBgColor(),
                    getTextColor(),
                    getBorderColor(),
                    'text-center hover:opacity-90',
                    isPending && 'animate-pulse',
                    className,
                  )}
                >
                  <div className='flex items-center gap-2'>
                    <Zap className='h-4 w-4' />
                    <span>
                      {formatNumber(creditsLeft)} / {formatNumber(maxCredits)}
                    </span>
                  </div>

                  {onRefresh && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onRefresh();
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
                  )}
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

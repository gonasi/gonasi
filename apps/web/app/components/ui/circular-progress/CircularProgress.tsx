import * as React from 'react';

import { cn } from '~/lib/utils';

export interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: number;
  thickness?: number;
  showValue?: boolean;
  valueLabel?: string;
  colorClass?: string;
}

const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      size = 16,
      thickness = 2,
      showValue = false,
      valueLabel,
      colorClass = 'text-secondary',
      ...props
    },
    ref,
  ) => {
    const percentage = value / max;
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = percentage * circumference; // <== reversed logic

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{ width: size, height: size }}
        role='progressbar'
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        {...props}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className='rotate-[-90deg]'>
          <circle
            className='text-muted-foreground/20'
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill='none'
            strokeWidth={thickness}
            stroke='currentColor'
          />
          <circle
            className={cn('transition-all duration-300 ease-in-out', colorClass)}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill='none'
            strokeWidth={thickness}
            stroke='currentColor'
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap='round'
          />
        </svg>
        {showValue && (
          <div className='absolute inset-0 flex items-center justify-center text-sm font-medium'>
            {valueLabel ? valueLabel : `${Math.round((1 - percentage) * 100)}%`}
          </div>
        )}
      </div>
    );
  },
);

CircularProgress.displayName = 'CircularProgress';

export { CircularProgress };

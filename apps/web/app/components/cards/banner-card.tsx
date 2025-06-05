import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertOctagon, AlertTriangle, CheckCircle, Info, Lightbulb, X } from 'lucide-react';

interface BannerCardProps {
  message: string;
  description?: string;
  variant?: 'info' | 'success' | 'warning' | 'error' | 'tip';
  className?: string;
}

const variantStyles: Record<
  NonNullable<BannerCardProps['variant']>,
  {
    icon: LucideIcon;
    textColor: string;
    bgColor: string;
  }
> = {
  info: {
    icon: Info,
    textColor: 'text-info-foreground',
    bgColor: 'bg-info',
  },
  success: {
    icon: CheckCircle,
    textColor: 'text-success',
    bgColor: 'bg-success-foreground',
  },
  warning: {
    icon: AlertTriangle,
    textColor: 'text-warning-foreground',
    bgColor: 'bg-warning',
  },
  error: {
    icon: AlertOctagon,
    textColor: 'text-error',
    bgColor: 'bg-error-foreground',
  },
  tip: {
    icon: Lightbulb,
    textColor: 'text-tip-foreground',
    bgColor: 'bg-tip',
  },
};

export function BannerCard({ message, description, variant = 'info', className }: BannerCardProps) {
  const [closing, setClosing] = useState(false);
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => setVisible(false), 200); // must match transition duration
  };

  if (!visible) return null;

  const { icon: Icon, textColor, bgColor } = variantStyles[variant];

  return (
    <div
      className={`flex transform justify-between space-x-4 rounded-md p-4 transition-opacity duration-200 ease-in-out ${closing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'} ${bgColor} ${className ?? ''} `}
    >
      <div className='w-full'>
        <div className='relative w-full justify-between'>
          <div className='flex space-x-2'>
            <Icon className={`${textColor} flex-shrink-0`} size={20} />
            <p className={`${textColor} text-sm`}>{message}</p>
          </div>
          <div className='absolute -top-6 -right-4'>
            <button
              onClick={handleClose}
              className={`${textColor} ${bgColor} border-foreground rounded-full border transition-opacity duration-150 hover:cursor-pointer hover:opacity-90`}
              aria-label='Dismiss'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {description ? (
          <div className='py-4'>
            <p className={`${textColor} font-secondary text-sm`}>{description}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

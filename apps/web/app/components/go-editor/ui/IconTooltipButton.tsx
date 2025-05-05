import type { LucideIcon } from 'lucide-react';

import { Button, type ButtonProps } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';

type IconTooltipButtonProps = {
  title: string;
  icon: LucideIcon;
  active?: boolean;
  preventBubble?: boolean;
} & ButtonProps;

export function IconTooltipButton({
  title,
  icon: Icon,
  active = false,
  preventBubble = false,
  onClick,
  ...buttonProps
}: IconTooltipButtonProps) {
  const handleClick: React.MouseEventHandler<HTMLElement> = (e) => {
    if (preventBubble) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClick?.(e as any); // call passed in onClick
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className={cn('z-5', buttonProps.className, {
              'bg-primary/10': active,
            })}
            {...buttonProps}
            onClick={handleClick}
            style={{ zIndex: 5, ...buttonProps.style }}
          >
            <Icon
              className={cn('h-4 w-4', {
                'text-primary': active,
              })}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

import type { LucideIcon } from 'lucide-react';

import { Button, type ButtonProps } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';

type IconTooltipButtonProps = {
  title: string;
  icon: LucideIcon;
  active?: boolean;
} & ButtonProps;

export function IconTooltipButton({
  title,
  icon: Icon,
  active = false,
  ...buttonProps
}: IconTooltipButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className={cn('z-5', {
              'bg-primary/10': active,
            })}
            {...buttonProps}
            style={{ zIndex: '5' }}
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

import type { DragControls } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

import { Button, type ButtonProps } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';

type ReorderIconTooltipProps = {
  title: string;
  icon: LucideIcon;
  active?: boolean;
  dragControls: DragControls;
} & ButtonProps;

export function ReorderIconTooltip({
  title,
  icon: Icon,
  active = false,
  dragControls,
  ...buttonProps
}: ReorderIconTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className={cn('z-5', 'bg-card border-border/10 cursor-grab border p-2', {
              'bg-card': active,
            })}
            {...buttonProps}
            style={{ zIndex: '5', touchAction: 'none' }}
            onPointerDown={(event) => dragControls.start(event)}
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

import type { DragControls } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';

interface ReorderIconTooltipProps {
  title: string;
  icon: LucideIcon;
  active?: boolean;
  dragControls: DragControls;
  disabled?: boolean;
  className?: string;
}

export function ReorderIconTooltip({
  title,
  icon: Icon,
  active = false,
  dragControls,
  disabled,
  className,
}: ReorderIconTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className={cn(
              'z-5',
              'bg-border/80 border-card/10 cursor-grab border p-2',
              {
                'bg-border': active,
              },
              className,
            )}
            style={{ zIndex: '5', touchAction: 'none' }}
            onPointerDown={(event) => dragControls.start(event)}
            disabled={disabled}
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

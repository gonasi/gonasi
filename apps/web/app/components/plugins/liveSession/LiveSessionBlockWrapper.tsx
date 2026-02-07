import { motion, Reorder, useDragControls, useMotionValue } from 'framer-motion';
import { Gauge, GripVerticalIcon, Pencil, Timer, Trash } from 'lucide-react';

import type { LiveSessionBlock } from '@gonasi/database/liveSessions';

import { ActionDropdown } from '~/components/action-dropdown';
import { Badge } from '~/components/ui/badge';
import { ReorderIconTooltip } from '~/components/ui/tooltip/ReorderIconToolTip';
import { useRaisedShadow } from '~/hooks/useRaisedShadow';

function toTitleCaseFromUnderscore(input: string): string {
  return input
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getDifficultyStyles(difficulty: 'easy' | 'medium' | 'hard') {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';
    case 'medium':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400';
    case 'hard':
      return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
  }
}

interface LiveSessionBlockWrapperProps {
  children: React.ReactNode;
  block: LiveSessionBlock;
  loading?: boolean;
  canEdit: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isDragging?: boolean;
  onMinimize?: () => void;
  onExpand?: () => void;
}

export default function LiveSessionBlockWrapper({
  children,
  block,
  loading,
  canEdit,
  onEdit,
  onDelete,
  isDragging = false,
  onMinimize,
  onExpand,
}: LiveSessionBlockWrapperProps) {
  const title = toTitleCaseFromUnderscore(block.plugin_type ?? 'Block');

  const blockY = useMotionValue(0);
  const blockShadow = useRaisedShadow(blockY);
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={block}
      id={block.id}
      style={{ ...blockShadow, y: blockY, borderRadius: '8px' }}
      dragListener={false}
      dragControls={dragControls}
      className='bg-card/80 border-card w-full rounded-lg border'
    >
      <div className='relative rounded-lg p-4'>
        <div className='absolute top-3 -left-4'>
          <ReorderIconTooltip
            title='Drag and drop to rearrange blocks'
            icon={GripVerticalIcon}
            disabled={loading || !canEdit}
            dragControls={dragControls}
            onPointerDown={onMinimize}
            onPointerUp={onExpand}
          />
        </div>

        <div className='flex w-full items-center justify-between'>
          <div className='ml-4 flex items-center gap-2'>
            <span className='text-muted-foreground text-sm'>{title}</span>
            <Badge variant='outline' className='text-xs'>
              <Timer />
              {block.time_limit}
            </Badge>
            <Badge className={`text-xs capitalize ${getDifficultyStyles(block.difficulty)}`}>
              <Gauge />
              {block.difficulty}
            </Badge>
          </div>

          {canEdit ? (
            <ActionDropdown
              items={[
                { title: 'Edit', icon: Pencil, onClick: onEdit },
                { title: 'Delete', icon: Trash, onClick: onDelete },
              ]}
            />
          ) : null}
        </div>

        <motion.div
          className='overflow-hidden'
          initial={false}
          animate={{
            height: isDragging ? 0 : 'auto',
            opacity: isDragging ? 0 : 1,
            marginTop: isDragging ? 0 : 16,
          }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0.0, 0.2, 1],
          }}
        >
          {children}
        </motion.div>
      </div>
    </Reorder.Item>
  );
}

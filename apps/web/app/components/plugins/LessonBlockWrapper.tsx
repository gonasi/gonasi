import { Reorder, useDragControls, useMotionValue } from 'framer-motion';
import { GripVerticalIcon, Pencil, Trash } from 'lucide-react';

import { ActionDropdown } from '../action-dropdown';
import { ReorderIconTooltip } from '../ui/tooltip/ReorderIconToolTip';

import { useRaisedShadow } from '~/hooks/useRaisedShadow';
import { cn } from '~/lib/utils';
import type { Block } from '~/routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/lesson-blocks-index';

/**
 * Utility: Converts strings like "plugin_type_example" to "Plugin Type Example"
 */
function toTitleCaseFromUnderscore(input: string): string {
  return input
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
interface LessonBlockWrapperProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  loading?: boolean;
  block: Block;
}

export default function LessonBlockWrapper(props: LessonBlockWrapperProps) {
  const { children, onEdit, onDelete, loading, block } = props;

  const title = toTitleCaseFromUnderscore(block.plugin_type ?? 'Edit');

  const courseY = useMotionValue(0);
  const blockBoxShadow = useRaisedShadow(courseY);
  const blockDragControls = useDragControls();

  return (
    <Reorder.Item
      value={block}
      id={block.id}
      style={{ boxShadow: blockBoxShadow, y: courseY }}
      dragListener={false}
      dragControls={blockDragControls}
      className='bg-card/80 border-card w-full rounded-lg border'
    >
      <div className={cn('relative px-4 pt-4')}>
        <>
          <div className='absolute top-3 -left-4'>
            <ReorderIconTooltip
              title='Drag and drop to rearrange blocks'
              icon={GripVerticalIcon}
              disabled={loading}
              dragControls={blockDragControls}
            />
          </div>
          <div className='flex w-full items-center justify-between'>
            <div className='text-muted-foreground ml-4 text-sm'>{title}</div>
            <ActionDropdown
              items={[
                { title: 'Edit', icon: Pencil, onClick: onEdit },
                { title: 'Delete', icon: Trash, onClick: onDelete },
              ]}
            />
          </div>
        </>
        <div className='mt-4'>{children}</div>
      </div>
    </Reorder.Item>
  );
}

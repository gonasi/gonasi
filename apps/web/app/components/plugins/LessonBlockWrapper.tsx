import { motion, Reorder, useDragControls, useMotionValue } from 'framer-motion';
import { GripVerticalIcon, Pencil, Trash } from 'lucide-react';

import { ActionDropdown } from '../action-dropdown';
import { ReorderIconTooltip } from '../ui/tooltip/ReorderIconToolTip';

import { useRaisedShadow } from '~/hooks/useRaisedShadow';
import { cn } from '~/lib/utils';
import type { Block } from '~/routes/organizations/courses/course/content/chapterId/lessonId/lesson-blocks/lesson-blocks-index';

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
  canEdit: boolean;
  isDragging?: boolean;
  onMinimize?: () => void;
  onExpand?: () => void;
}

export default function LessonBlockWrapper(props: LessonBlockWrapperProps) {
  const {
    children,
    onEdit,
    onDelete,
    loading,
    block,
    canEdit,
    isDragging = false,
    onMinimize,
    onExpand,
  } = props;

  const title = toTitleCaseFromUnderscore(block.plugin_type ?? 'Edit');

  const courseY = useMotionValue(0);
  const blockBoxShadow = useRaisedShadow(courseY);
  const blockDragControls = useDragControls();

  return (
    <Reorder.Item
      value={block}
      id={block.id}
      style={{ ...blockBoxShadow, y: courseY, borderRadius: '8px' }}
      dragListener={false}
      dragControls={blockDragControls}
      className='bg-card/80 border-card w-full rounded-lg border'
    >
      <div className={cn('relative rounded-lg p-4')}>
        <>
          <div className='absolute top-3 -left-4'>
            <ReorderIconTooltip
              title='Drag and drop to rearrange blocks'
              icon={GripVerticalIcon}
              disabled={loading || !canEdit}
              dragControls={blockDragControls}
              onPointerDown={onMinimize}
              onPointerUp={onExpand}
            />
          </div>
          <div className='flex w-full items-center justify-between'>
            <div className='text-muted-foreground ml-4 text-sm'>{title}</div>
            {canEdit ? (
              <ActionDropdown
                items={[
                  { title: 'Edit', icon: Pencil, onClick: onEdit },
                  { title: 'Delete', icon: Trash, onClick: onDelete },
                ]}
              />
            ) : null}
          </div>
        </>
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

import { useDroppable } from '@dnd-kit/core';
import { Check } from 'lucide-react';

import type { LeftItem, RightItem } from './types';

export function DroppableArea({
  id,
  leftItem,
  matchedRightItem,
}: {
  id: string;
  leftItem: LeftItem;
  matchedRightItem: RightItem | undefined;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: 'leftItem',
      leftItemId: leftItem.id,
      accepts: 'rightItem',
    },
    disabled: leftItem.matchedWith !== null,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex h-16 w-full items-center justify-center rounded-lg border ${
        leftItem.matchedWith
          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
          : isOver
            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
            : 'border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'
      }`}
    >
      {leftItem.matchedWith ? (
        <div className='flex items-center gap-2'>
          <span>{matchedRightItem?.content}</span>
          <Check className='h-5 w-5 text-green-500' />
        </div>
      ) : (
        <span className='text-gray-400 dark:text-gray-500'>Drop purpose here</span>
      )}
    </div>
  );
}

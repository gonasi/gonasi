import { useDraggable } from '@dnd-kit/core';

import type { RightItem } from './types';

// Draggable purpose component
export function DraggableRight({ right }: { right: RightItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: right.id,
    data: {
      type: 'right',
      right,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800 ${isDragging ? 'opacity-30' : 'opacity-100'} cursor-grab touch-manipulation`}
      style={{
        transform: isDragging ? 'scale(1.05)' : undefined,
        transition: 'transform 0.1s, opacity 0.2s',
      }}
    >
      {right.content}
    </div>
  );
}

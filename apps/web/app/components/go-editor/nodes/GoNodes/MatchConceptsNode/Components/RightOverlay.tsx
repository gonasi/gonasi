import type { RightItem } from './types';

export function RightOverlay({ right }: { right: RightItem }) {
  return (
    <div className='rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800'>
      {right.content}
    </div>
  );
}

import type React from 'react';
import { Pencil, Trash } from 'lucide-react';

import { formatFileSize } from '../file-renderer-types';

import { ActionDropdown } from '~/components/action-dropdown';
import type { FileLoaderItemType } from '~/routes/dashboard/file-library/all-files';

interface MediaCardProps {
  file: FileLoaderItemType;
  media?: React.ReactNode;
}

export const MediaCard: React.FC<MediaCardProps> = ({ file, media }) => {
  const basePath = '';

  const options = [
    {
      title: 'Edit',
      icon: Pencil,
      to: `${basePath}/edit-lesson-details`,
    },
    {
      title: 'Delete lesson',
      icon: Trash,
      to: `${basePath}/delete`,
    },
  ];

  return (
    <div className='bg-card/80 hover:bg-card relative h-60 w-full rounded-lg p-4 transition-colors duration-300 hover:cursor-pointer md:h-82'>
      {/* Top-right button */}
      <div className='bg-card absolute top-2 right-2 rounded-sm'>
        <ActionDropdown items={options} />
      </div>

      <div className='flex h-40 w-full items-center justify-center md:h-60'>{media}</div>

      <div className='mt-2'>
        <h3 className='truncate font-medium'>{file.name}</h3>
        <div className='text-muted-foreground font-secondary flex justify-between text-xs'>
          <span>{formatFileSize(file.size)}</span>
          <span>{new Date(file.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

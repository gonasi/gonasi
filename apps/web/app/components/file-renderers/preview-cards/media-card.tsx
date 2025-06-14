import type React from 'react';
import { useParams } from 'react-router';
import { Pencil, Trash } from 'lucide-react';

import { formatFileSize } from '../file-renderer-types';

import { ActionDropdown } from '~/components/action-dropdown';
import type { FileLoaderItemType } from '~/routes/dashboard/file-library/all-files';

interface MediaCardProps {
  file: FileLoaderItemType;
  media?: React.ReactNode;
}

export const MediaCard: React.FC<MediaCardProps> = ({ file, media }) => {
  const { companyId } = useParams();
  const basePath = `/dashboard/${companyId}/file-library/${file.id}`;

  const options = [
    { title: 'Edit', icon: Pencil, to: `${basePath}/edit` },
    { title: 'Delete', icon: Trash, to: `${basePath}/delete` },
  ];

  return (
    <div className='group bg-card/10 hover:bg-card/30 relative w-full rounded-lg transition-colors duration-300 hover:cursor-pointer'>
      {/* Media Preview */}
      <div className='border-border/5 flex h-40 w-full max-w-full items-center justify-center border-b md:h-60'>
        {media}
      </div>

      {/* File Info */}
      <div className='flex items-center justify-between p-4'>
        <div>
          <h3 className='truncate font-medium'>{file.name}</h3>
          <div className='font-secondary text-muted-foreground flex flex-col justify-between text-xs'>
            <span>{formatFileSize(file.size)}</span>
            <span className='pt-1'>{new Date(file.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className=''>
          <ActionDropdown items={options} />
        </div>
      </div>
    </div>
  );
};

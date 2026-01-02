import type React from 'react';
import { useParams } from 'react-router';
import { Pencil, Settings, Trash } from 'lucide-react';

import { formatFileSize } from '../file-renderer-types';

import { ActionDropdown } from '~/components/action-dropdown';
import type { FileLoaderItemType } from '~/routes/organizations/builder/course/file-library/file-library-index';

interface MediaCardProps {
  file: FileLoaderItemType;
  media?: React.ReactNode;
  canEdit: boolean;
}

export const MediaCard: React.FC<MediaCardProps> = ({ file, media, canEdit }) => {
  const { organizationId, courseId } = useParams();
  const basePath = `/${organizationId}/builder/${courseId}/file-library/${file.id}`;

  const options = [
    { title: 'Edit', icon: Pencil, to: `${basePath}/edit` },
    ...(file.file_type === 'model3d'
      ? [{ title: 'Configure 3D', icon: Settings, to: `${basePath}/configure` }]
      : []),
    { title: 'Delete', icon: Trash, to: `${basePath}/delete` },
  ];

  return (
    <div className='group bg-card/10 hover:bg-card/30 relative w-full transition-colors duration-300 hover:cursor-pointer'>
      {/* Media Preview */}
      <div className='bg-card flex h-40 w-full items-center justify-center md:h-60'>{media}</div>

      {/* File Info */}
      <div className='bg-background flex items-center gap-3 p-4 md:bg-transparent'>
        {/* LEFT: text column */}
        <div className='min-w-0 flex-1'>
          <h3 className='truncate font-medium'>{file.name}</h3>

          <div className='font-secondary text-muted-foreground mt-1 flex flex-col text-xs'>
            <span>{formatFileSize(file.size)}</span>
            <span>{new Date(file.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* RIGHT: actions */}
        {canEdit && (
          <div className='shrink-0'>
            <ActionDropdown items={options} />
          </div>
        )}
      </div>
    </div>
  );
};

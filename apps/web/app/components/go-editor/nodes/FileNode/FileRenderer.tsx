import type { JSX } from 'react';
import { Link } from 'react-router';
import clsx from 'clsx';
import { Box, Download, FileIcon, FileText } from 'lucide-react';

import { FileType } from '@gonasi/schemas/file';

import { PlainButton } from '~/components/ui/button';

export function FileRenderer({
  src,
  fileName,
  fileType,
  className,
  fileAlt,
}: {
  src: string;
  fileName: string;
  fileType: FileType;
  className: string | null;
  fileAlt: string;
}): JSX.Element {
  let Icon = FileIcon;
  switch (fileType) {
    case FileType.MODEL_3D:
      Icon = Box;
      break;
    case FileType.DOCUMENT:
      Icon = FileText;
      break;
    default:
      Icon = FileIcon;
  }

  return (
    <div className={clsx('bg-card flex items-center gap-2 rounded-md p-4', className)}>
      <Icon size={24} />
      <span className='flex-1 truncate'>{fileAlt}</span>
      <Link
        to={src}
        download={fileName}
        target='_blank'
        rel='noopener noreferrer'
        onClick={(e) => e.stopPropagation()}
        className='ml-2'
      >
        <PlainButton>
          <Download strokeWidth={2} />
        </PlainButton>
      </Link>
    </div>
  );
}

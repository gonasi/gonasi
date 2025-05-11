import { Box, File as FileIcon, FileAudio, FileImage, FileText, FileVideo } from 'lucide-react';

import { FileType } from '.';

interface Props {
  height: number | 'inherit';
  width: number | 'inherit' | string;
  fileType?: FileType;
}

export function FileComponentFallback({ height, width, fileType = FileType.OTHER }: Props) {
  // Select appropriate icon based on file type
  let IconComponent = FileIcon;

  switch (fileType) {
    case FileType.IMAGE:
      IconComponent = FileImage;
      break;
    case FileType.AUDIO:
      IconComponent = FileAudio;
      break;
    case FileType.VIDEO:
      IconComponent = FileVideo;
      break;
    case FileType.MODEL_3D:
      IconComponent = Box;
      break;
    case FileType.DOCUMENT:
      IconComponent = FileText;
      break;
    default:
      IconComponent = FileIcon;
  }

  return (
    <div
      className='bg-card flex animate-pulse items-center justify-center rounded-md'
      style={{ height, width }}
    >
      <IconComponent className='text-muted-foreground' size={48} />
    </div>
  );
}

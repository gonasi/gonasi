import { Box, File as FileIcon, FileAudio, FileImage, FileText, FileVideo } from 'lucide-react';

import { FileType } from '@gonasi/schemas/file';

interface Props {
  height: number | 'inherit';
  width: number | 'inherit' | string;
  fileType?: FileType;
}

// Fallback for image files
function ImageFallback({ height, width }: Pick<Props, 'height' | 'width'>) {
  return (
    <div
      className='bg-muted/20 border-border flex items-center justify-center rounded-md border border-dashed'
      style={{ height, width }}
    >
      <FileImage className='text-muted-foreground' size={48} />
    </div>
  );
}

// Fallback for audio files
function AudioFallback({ height, width }: Pick<Props, 'height' | 'width'>) {
  return (
    <div
      className='bg-muted/10 border-border flex items-center justify-center rounded-md border border-dashed'
      style={{ height, width }}
    >
      <FileAudio className='text-muted-foreground' size={48} />
    </div>
  );
}

// Fallback for video files
function VideoFallback({ height, width }: Pick<Props, 'height' | 'width'>) {
  return (
    <div
      className='bg-muted/10 border-border flex items-center justify-center rounded-md border border-dashed'
      style={{ height, width }}
    >
      <FileVideo className='text-muted-foreground' size={48} />
    </div>
  );
}

// Fallback for 3D models
function ModelFallback({ height, width }: Pick<Props, 'height' | 'width'>) {
  return (
    <div
      className='bg-muted/5 border-border flex items-center justify-center rounded-md border border-dashed'
      style={{ height, width }}
    >
      <Box className='text-muted-foreground' size={48} />
    </div>
  );
}

// Fallback for documents
function DocumentFallback() {
  return (
    <div className='bg-card flex animate-pulse items-center justify-center rounded-md border border-dashed p-4'>
      <FileText className='text-muted-foreground' size={24} />
    </div>
  );
}

// Generic fallback
function DefaultFallback({ height, width }: Pick<Props, 'height' | 'width'>) {
  return (
    <div
      className='bg-card border-border flex items-center justify-center rounded-md border border-dashed'
      style={{ height, width }}
    >
      <FileIcon className='text-muted-foreground' size={48} />
    </div>
  );
}

// Master fallback component
export function FileComponentFallback({ height, width, fileType = FileType.OTHER }: Props) {
  switch (fileType) {
    case FileType.IMAGE:
      return <ImageFallback height={height} width={width} />;
    case FileType.AUDIO:
      return <AudioFallback height={height} width={width} />;
    case FileType.VIDEO:
      return <VideoFallback height={height} width={width} />;
    case FileType.MODEL_3D:
      return <ModelFallback height={height} width={width} />;
    case FileType.DOCUMENT:
      return <DocumentFallback />;
    default:
      return <DefaultFallback height={height} width={width} />;
  }
}

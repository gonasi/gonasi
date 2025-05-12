import type React from 'react';
import { Box, File as FileIcon, FileAudio, FileImage, FileText, FileVideo } from 'lucide-react';

import { FileType } from '@gonasi/schemas/file';

// Utility to get file icon based on file type
export const getFileIcon = (fileType: FileType, props?: React.ComponentProps<typeof FileText>) => {
  const defaultProps = {
    size: 48,
    className: 'text-gray-500',
    ...props,
  };

  switch (fileType) {
    case FileType.IMAGE:
      return <FileImage {...defaultProps} />;
    case FileType.VIDEO:
      return <FileVideo {...defaultProps} />;
    case FileType.AUDIO:
      return <FileAudio {...defaultProps} />;
    case FileType.DOCUMENT:
      return <FileText {...defaultProps} />;
    case FileType.MODEL_3D:
      return <Box {...defaultProps} />;
    default:
      return <FileIcon {...defaultProps} />;
  }
};

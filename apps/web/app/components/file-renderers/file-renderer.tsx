import type React from 'react';

import { FileType } from '@gonasi/schemas/file';

import { DocumentPreviewCard } from './preview-cards/document-preview-card';
import { FileCard } from './preview-cards/file-preview-card';
import { ImagePreviewCard } from './preview-cards/image-preview-card';
import { MediaPreviewCard } from './preview-cards/media-preview-card';
import { ModelPreviewCard } from './preview-cards/model-preview-card';

import type { FileLoaderItemType } from '~/routes/dashboard/file-library/all-files';

// Advanced File Renderer
export const FileRenderer: React.FC<{ file: FileLoaderItemType }> = ({ file }) => {
  switch (file.file_type) {
    case FileType.IMAGE:
      return <ImagePreviewCard file={file} />;
    case FileType.VIDEO:
    case FileType.AUDIO:
      return <MediaPreviewCard file={file} />;
    case FileType.DOCUMENT:
      return <DocumentPreviewCard file={file} />;
    case FileType.MODEL_3D:
      return <ModelPreviewCard file={file} />;
    default:
      return <FileCard file={file} />;
  }
};

export default FileRenderer;

export type { formatFileSize } from './file-renderer-types';

export { getFileIcon } from './file-icons';

import type React from 'react';

import { FileType } from '@gonasi/schemas/file';

import { DocumentPreviewCard } from './preview-cards/document-preview-card';
import { FileCard } from './preview-cards/file-preview-card';
import { ImagePreviewCard } from './preview-cards/image-preview-card';
import { MediaCard } from './preview-cards/media-card';
import { MediaPreviewCard } from './preview-cards/media-preview-card';
import { ModelPreviewCard } from './preview-cards/model-preview-card';

import type { FileLoaderItemType } from '~/routes/dashboard/file-library/all-files';

// Advanced File Renderer her
export const FileRenderer: React.FC<{ file: FileLoaderItemType; canEdit: boolean }> = ({
  file,
  canEdit,
}) => {
  switch (file.file_type) {
    case FileType.IMAGE:
      return <MediaCard file={file} media={<ImagePreviewCard file={file} />} canEdit={canEdit} />;
    case FileType.VIDEO:
    case FileType.AUDIO:
      return <MediaCard file={file} media={<MediaPreviewCard file={file} />} canEdit={canEdit} />;
    case FileType.DOCUMENT:
      return <MediaCard file={file} media={<DocumentPreviewCard file={file} />} />;
    case FileType.MODEL_3D:
      return <MediaCard file={file} media={<ModelPreviewCard file={file} />} />;
    default:
      return <MediaCard file={file} media={<FileCard file={file} />} />;
  }
};

export default FileRenderer;

export type { formatFileSize } from './file-renderer-types';

export { getFileIcon } from './file-icons';

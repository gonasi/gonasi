import { FileText } from 'lucide-react';

import { MediaCard } from './media-card';

import type { FileLoaderItemType } from '~/routes/dashboard/file-library/all-files';

export const DocumentPreviewCard = ({ file }: { file: FileLoaderItemType }) => {
  return <MediaCard file={file} icon={<FileText size={48} />} />;
};

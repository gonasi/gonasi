import { FileText } from 'lucide-react';

import type { FileLoaderItemType } from '~/routes/dashboard/file-library/all-files';

export const DocumentPreviewCard = ({ file }: { file: FileLoaderItemType }) => {
  return <FileText size={48} />;
};

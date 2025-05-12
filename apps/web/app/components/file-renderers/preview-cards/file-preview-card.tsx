import { getFileIcon } from '../file-icons';
import { MediaCard } from './media-card';

import type { FileLoaderItemType } from '~/routes/dashboard/file-library/all-files';

export const FileCard = ({ file }: { file: FileLoaderItemType }) => (
  <MediaCard file={file} icon={getFileIcon(file.file_type)} />
);

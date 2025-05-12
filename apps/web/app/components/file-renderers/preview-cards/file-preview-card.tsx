import { getFileIcon } from '../file-icons';
import { MediaCard } from './media-card';

import type { FileLoaderItemType } from '~/routes/dashboard/file-library/all-files';

export const FileCard = ({ file }: { file: FileLoaderItemType }) => (
  <MediaCard
    file={file}
    icon={getFileIcon(file.file_type)}
    actions={
      <button
        onClick={() => window.open(file.signed_url, '_blank')}
        className='flex-1 rounded-md bg-blue-500 px-3 py-1 text-white hover:bg-blue-600'
      >
        Preview
      </button>
    }
  />
);

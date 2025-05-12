import { Box } from 'lucide-react';

import { MediaCard } from './media-card';

import type { FileLoaderItemType } from '~/routes/dashboard/file-library/all-files';

export const ModelPreviewCard = ({ file }: { file: FileLoaderItemType }) => (
  <MediaCard
    file={file}
    icon={<Box size={48} className='text-purple-500' />}
    actions={
      <button
        onClick={() => window.open(file.signed_url, '_blank')}
        className='flex-1 rounded-md bg-purple-500 px-3 py-1 text-white hover:bg-purple-600'
      >
        Download Model
      </button>
    }
  />
);

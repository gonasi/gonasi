import { FileType } from '@gonasi/schemas/file';

import { MediaCard } from './media-card';

import type { FileLoaderItemType } from '~/routes/dashboard/file-library/all-files';

export const MediaPreviewCard = ({ file }: { file: FileLoaderItemType }) => {
  const isVideo = file.file_type === FileType.VIDEO;
  const isAudio = file.file_type === FileType.AUDIO;

  const media = isVideo ? (
    <video controls className='w-full rounded-md' src={file.url} />
  ) : isAudio ? (
    <audio controls className='w-full' src={file.url} />
  ) : null;

  return <MediaCard file={file} media={media} />;
};

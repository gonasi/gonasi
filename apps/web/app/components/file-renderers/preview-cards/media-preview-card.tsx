import { FileType } from '@gonasi/schemas/file';

import type { FileLoaderItemType } from '~/routes/organizations/builder/course/file-library/file-library-index';

export const MediaPreviewCard = ({ file }: { file: FileLoaderItemType }) => {
  const isVideo = file.file_type === FileType.VIDEO;
  const isAudio = file.file_type === FileType.AUDIO;

  if (isVideo && file.signed_url) {
    // Use server-generated signed URL for authenticated video delivery
    return (
      <video
        controls
        className='h-full w-full object-contain'
        src={file.signed_url}
        style={{ aspectRatio: '16/9' }}
        preload='metadata'
      >
        <track kind='captions' />
        Your browser does not support the video tag.
      </video>
    );
  }

  if (isAudio && file.signed_url) {
    return (
      <div className='bg-muted flex h-full w-full items-center justify-center p-4'>
        <audio controls className='w-full' src={file.signed_url} preload='metadata'>
          Your browser does not support the audio tag.
        </audio>
      </div>
    );
  }

  return null;
};

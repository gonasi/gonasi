import { useEffect } from 'react';
import { useFetcher } from 'react-router';

import { Spinner } from '~/components/loaders';

interface VideoPreviewProps {
  videoId: string;
}

export function VideoPreview({ videoId }: VideoPreviewProps) {
  const videoFetcher = useFetcher<{ success: boolean; data: any }>();

  useEffect(() => {
    if (videoId) {
      videoFetcher.load(`/api/files/${videoId}/signed-url?mode=preview`);
    }
  }, [videoId]);

  const videoFile = videoFetcher.data?.data;
  const isLoading = videoFetcher.state === 'loading';

  if (isLoading) {
    return (
      <div className='bg-muted flex aspect-video w-full items-center justify-center rounded-lg'>
        <Spinner />
      </div>
    );
  }

  if (!videoFile) {
    return (
      <div className='bg-muted flex aspect-video w-full items-center justify-center rounded-lg'>
        <p className='text-muted-foreground text-sm'>Failed to load video preview</p>
      </div>
    );
  }

  return (
    <video
      src={videoFile.signed_url}
      controls
      className='w-full rounded-lg'
      style={{ aspectRatio: '16/9' }}
      preload='metadata'
    >
      Your browser does not support the video tag.
    </video>
  );
}

import { useEffect } from 'react';
import { useFetcher } from 'react-router';
import { Volume2 } from 'lucide-react';

import { Spinner } from '~/components/loaders';

interface AudioPreviewProps {
  audioId: string;
}

export function AudioPreview({ audioId }: AudioPreviewProps) {
  const audioFetcher = useFetcher<{ success: boolean; data: any }>();

  useEffect(() => {
    if (audioId) {
      audioFetcher.load(`/api/files/${audioId}/signed-url?mode=preview`);
    }
  }, [audioId]);

  const audioFile = audioFetcher.data?.data;
  const isLoading = audioFetcher.state === 'loading';

  if (isLoading) {
    return (
      <div className='bg-muted flex w-full items-center justify-center rounded-lg p-8'>
        <Spinner />
      </div>
    );
  }

  if (!audioFile) {
    return (
      <div className='bg-muted flex w-full items-center justify-center rounded-lg p-8'>
        <p className='text-muted-foreground text-sm'>Failed to load audio preview</p>
      </div>
    );
  }

  return (
    <div className='bg-card border-border w-full rounded-lg border p-6'>
      <div className='mb-4 flex items-center gap-2'>
        <Volume2 size={20} className='text-primary' />
        <span className='text-foreground text-sm font-medium'>{audioFile.name}</span>
      </div>
      <audio src={audioFile.signed_url} controls className='w-full' preload='metadata'>
        Your browser does not support the audio tag.
      </audio>
    </div>
  );
}

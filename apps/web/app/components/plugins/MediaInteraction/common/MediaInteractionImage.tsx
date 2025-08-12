import { useEffect } from 'react';
import { useFetcher } from 'react-router';
import { Image } from '@unpic/react';

import { Spinner } from '~/components/loaders';
import type { loader } from '~/routes/api/get-signed-url';
import { useStore } from '~/store';

interface MediaInteractionImageProps {
  imageId: string;
}

export default function MediaInteractionImage({ imageId }: MediaInteractionImageProps) {
  const fetcher = useFetcher<typeof loader>();

  const { mode } = useStore();

  useEffect(() => {
    if (imageId) {
      fetcher.load(`/api/files/${imageId}/signed-url?mode=${mode}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageId, mode]);

  // Show spinner while loading
  if (fetcher.state !== 'idle') {
    return <Spinner />;
  }

  // Check if data exists and was successful
  if (!fetcher.data || !fetcher.data.success || !fetcher.data.data) {
    return null; // or return an error state/placeholder
  }

  return (
    <>
      <Image
        src={fetcher.data.data.signed_url}
        layout='constrained'
        width={800}
        height={600}
        alt=''
      />
    </>
  );
}

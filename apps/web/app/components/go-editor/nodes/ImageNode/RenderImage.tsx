import { useEffect } from 'react';
import { useFetcher } from 'react-router';
import { Image } from '@unpic/react';

import type { loader } from '../../../../routes/api/get-signed-url';
import type { ImagePayload } from '.';

export function RenderImage({
  fileId,
  objectFit = 'cover',
  blurHash,
  width = 500,
  height = 500,
}: ImagePayload) {
  const fetcher = useFetcher<typeof loader>();
  const mode = 'preview';

  useEffect(() => {
    if (fileId) {
      fetcher.load(`/api/files/${fileId}/signed-url?mode=${mode}`);
    }
  }, [fileId]);

  const src = fetcher.data?.file?.signed_url;

  if (!src) {
    return <div className='h-[200px] w-[200px] animate-pulse bg-gray-100' />;
  }

  return (
    <Image
      src={src}
      layout='fixed'
      width={width}
      height={height}
      objectFit={objectFit}
      alt='Image'
      background={blurHash || fetcher.data?.file?.blur_preview || undefined}
      className='object-cover'
    />
  );
}

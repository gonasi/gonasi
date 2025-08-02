import { Image } from '@unpic/react';

import type { ImagePayload } from '.';

export function RenderImage({
  fileId,
  objectFit = 'cover',
  blurHash,
  width = 500,
  height = 500,
}: ImagePayload) {
  const src = `/api/files/${fileId}`;

  return (
    <div>
      <Image
        src={src}
        layout='fixed'
        width={width}
        height={height}
        objectFit={objectFit}
        alt='Image'
        background={blurHash}
        className='object-cover'
      />
    </div>
  );
}

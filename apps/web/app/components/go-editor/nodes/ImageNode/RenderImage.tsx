import { useEffect, useState } from 'react';
import { useFetcher } from 'react-router';
import { blurhashToCssGradientString } from '@unpic/placeholder';
import { Image } from '@unpic/react';
import { motion } from 'framer-motion';

import type { loader } from '../../../../routes/api/get-signed-url';
import type { ImagePayload } from '.';

export function RenderImage({
  fileId,
  objectFit = 'cover',
  blurHash,
  width = 800,
  height = 600,
}: ImagePayload) {
  const fetcher = useFetcher<typeof loader>();
  const [isLoaded, setIsLoaded] = useState(false);
  const mode = 'preview';

  useEffect(() => {
    if (fileId) {
      fetcher.load(`/api/files/${fileId}/signed-url?mode=${mode}`);
    }
  }, [fileId]);

  const src = fetcher.data?.file?.signed_url;
  const backgroundBlur = blurHash || fetcher.data?.file?.blur_preview || undefined;
  const placeholder = backgroundBlur ? blurhashToCssGradientString(backgroundBlur) : '#f3f4f6';

  return (
    <div
      className='relative overflow-hidden'
      style={{
        maxWidth: '100%',
        width,
        height,
      }}
    >
      {/* Blurred placeholder layer (behind) */}
      <div
        className='absolute inset-0'
        style={{
          background: placeholder,
          objectFit,
        }}
      />

      {/* Real image layer (on top, animated in) */}
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='absolute inset-0'
        >
          <Image
            src={src}
            layout='fixed'
            width={width}
            height={height}
            objectFit={objectFit}
            alt='Image'
            onLoad={() => setIsLoaded(true)}
            className='h-full w-full object-cover'
          />
        </motion.div>
      )}
    </div>
  );
}

import { blurhashToCssGradientString } from '@unpic/placeholder';
import { Image } from '@unpic/react';
import { motion } from 'framer-motion';

import type { FileLoaderItemType } from '~/routes/organizations/builder/course/file-library/file-library-index';

// Safe default blurhash (1x1 pixel gray)
const DEFAULT_BLURHASH = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

export const ImagePreviewCard = ({ file }: { file: FileLoaderItemType }) => {
  const placeholder = blurhashToCssGradientString(
    file.blur_preview && file.blur_preview.length >= 6 ? file.blur_preview : DEFAULT_BLURHASH,
  );

  return (
    <motion.div className='h-full w-full overflow-hidden transition-transform duration-300 ease-in-out group-hover:scale-101'>
      <Image
        src={file.signed_url}
        alt={`${file.name} thumbnail`}
        layout='constrained'
        height={100}
        aspectRatio={16 / 9}
        className='h-full w-full object-contain'
        background={placeholder}
      />
    </motion.div>
  );
};

import { Image } from '@unpic/react';
import { motion } from 'framer-motion';

import type { FileLoaderItemType } from '~/routes/organizations/builder/course/file-library/file-library-index';

export const ImagePreviewCard = ({ file }: { file: FileLoaderItemType }) => (
  <motion.div className='h-full w-full overflow-hidden transition-transform duration-300 ease-in-out group-hover:scale-101'>
    <Image
      src={file.signed_url}
      alt={`${file.name} thumbnail`}
      layout='constrained'
      height={300}
      aspectRatio={16 / 9}
      className='h-full w-full object-contain'
      background={file.blur_preview || 'auto'}
    />
  </motion.div>
);

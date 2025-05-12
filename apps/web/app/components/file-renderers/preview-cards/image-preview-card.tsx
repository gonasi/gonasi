import type { FileLoaderItemType } from '~/routes/dashboard/file-library/all-files';

export const ImagePreviewCard = ({ file }: { file: FileLoaderItemType }) => (
  <div className='flex h-full w-full flex-1 items-center justify-center'>
    <img src={file.signed_url} alt={file.name} className='h-full rounded-md object-contain' />
  </div>
);

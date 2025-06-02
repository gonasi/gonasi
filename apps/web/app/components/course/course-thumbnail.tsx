import { Link } from 'react-router';
import { Image } from '@unpic/react';
import { EditIcon, ImageIcon } from 'lucide-react';

interface Props {
  thumbnail: string | null;
  name: string;
  editLink: string;
}

export function CourseThumbnail({ thumbnail, name, editLink }: Props) {
  return (
    <div className='border-card relative aspect-[16/9] h-[200px] overflow-hidden rounded-md border'>
      <Link to={editLink} className='bg-secondary absolute top-2 right-2 rounded-full p-2'>
        <EditIcon className='text-secondary-foreground h-5 w-5' />
      </Link>

      {thumbnail ? (
        <Image
          src={thumbnail}
          layout='fullWidth'
          alt={name}
          priority
          background='auto'
          className='h-full w-full object-cover'
        />
      ) : (
        <div className='bg-muted text-muted-foreground flex h-full w-full flex-col items-center justify-center'>
          <ImageIcon className='mb-2 h-12 w-12' />
          <span className='font-secondary'>No thumbnail available</span>
        </div>
      )}
    </div>
  );
}

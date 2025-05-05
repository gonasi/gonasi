import { Link } from 'react-router';
import { Pencil } from 'lucide-react';

import { buttonVariants } from '~/components/ui/button';
import { cn } from '~/lib/utils';

interface EditableImageProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  to: string;
  canEdit?: boolean;
  className?: string;
  imageClassName?: string;
}

export function EditableImage({
  src,
  alt,
  to,
  canEdit = true,
  className,
  imageClassName,
  ...props
}: EditableImageProps) {
  return (
    <div className={cn('group relative overflow-hidden rounded-md', className)} {...props}>
      <img
        src={src || '/placeholder.svg'}
        alt={alt}
        className={cn('h-full w-full object-cover', imageClassName)}
      />
      <div className='absolute inset-0 bg-black/0 transition-all duration-200 group-hover:bg-black/20' />
      {canEdit && (
        <div className='absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
          <Link to={to} className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
            <Pencil className='h-5 w-5' />
            <span className='sr-only'>Edit image</span>
          </Link>
        </div>
      )}
    </div>
  );
}

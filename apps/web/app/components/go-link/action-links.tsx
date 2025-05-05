import { Link } from 'react-router';
import { Pencil, Trash2 } from 'lucide-react';

import { buttonVariants } from '../ui/button';

interface Props {
  editLink?: string;
  deleteLink?: string;
}

export function ActionLinks({ editLink, deleteLink }: Props) {
  return (
    <div className='flex items-center space-x-2'>
      {editLink ? (
        <Link to={editLink} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <Pencil />
        </Link>
      ) : null}
      {deleteLink ? (
        <Link to={deleteLink} className={buttonVariants({ variant: 'danger', size: 'sm' })}>
          <Trash2 />
        </Link>
      ) : null}
    </div>
  );
}

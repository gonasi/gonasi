import type { PropsWithChildren } from 'react';
import { Link } from 'react-router';
import { Plus } from 'lucide-react';

import { buttonVariants } from '~/components/ui/button';

interface CrudLayoutProps extends PropsWithChildren {
  title?: string;
  newLink: string;
  newText?: string;
}

export function ViewLayout({ children, title, newLink, newText }: CrudLayoutProps) {
  return (
    <section className='mb-10 w-full'>
      <div className='flex justify-between pb-4 md:pb-8'>
        {title ? <h2 className='font-oceanSemi text-xl'>{title}</h2> : <div />}

        <Link to={newLink} className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
          {newText ?? 'New'}
          <Plus />
        </Link>
      </div>
      <div className='pl-1 md:pl-2'>{children}</div>
    </section>
  );
}

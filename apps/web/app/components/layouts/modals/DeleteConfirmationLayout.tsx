import { CircleAlert, Trash2 } from 'lucide-react';

import { Button } from '~/components/ui/button';

interface Props {
  title: string;
  titlePrefix?: string;
  isLoading: boolean;
  handleClose: () => void;
}

export function DeleteConfirmationLayout({ titlePrefix, title, isLoading, handleClose }: Props) {
  return (
    <div>
      <div className='flex items-center justify-center pb-4'>
        <CircleAlert className='text-danger h-12 w-12' />
      </div>
      <h2 className='font-secondary text-muted-foreground text-center'>
        Are you sure you want to delete {titlePrefix}{' '}
        <span className='font-primary text-foreground'>{title}?</span>
      </h2>
      <p className='font-secondary text-muted-foreground pt-2 text-center text-xs'>
        This action is irreversible.
      </p>
      <div className='flex flex-col space-y-4 pt-4'>
        <Button
          type='submit'
          disabled={isLoading}
          isLoading={isLoading}
          variant='danger'
          rightIcon={<Trash2 />}
        >
          Delete
        </Button>
        <Button type='button' disabled={isLoading} variant='ghost' onClick={handleClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

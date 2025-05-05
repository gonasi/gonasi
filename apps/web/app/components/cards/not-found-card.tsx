import { CircleOff } from 'lucide-react';

interface Props {
  message: string;
}

export function NotFoundCard({ message }: Props) {
  return (
    <div className='bg-secondary/5 flex items-center space-x-4 rounded-md p-4'>
      <CircleOff className='text-secondary' />
      <p className='text-secondary'>{message}</p>
    </div>
  );
}

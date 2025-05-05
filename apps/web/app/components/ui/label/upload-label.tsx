/* eslint-disable jsx-a11y/label-has-associated-control */
import { Upload } from 'lucide-react';

interface Props {
  htmlFor: string;
  className?: string;
}

export function UploadLabel({ htmlFor, className }: Props) {
  return (
    <label
      htmlFor={htmlFor}
      className={`flex h-full w-full items-center justify-center hover:cursor-pointer ${className}`}
    >
      <Upload className='text-muted-foreground' />
    </label>
  );
}

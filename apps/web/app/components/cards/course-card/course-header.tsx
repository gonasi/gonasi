import { CardTitle } from '~/components/ui/card';

interface CourseHeaderProps {
  name: string;
}

export function CourseHeader({ name }: CourseHeaderProps) {
  return (
    <>
      <CardTitle className='text-md line-clamp-1'>{name}</CardTitle>
    </>
  );
}

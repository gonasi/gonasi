import { Link } from 'react-router';

import { Card, CardContent, CardDescription, CardTitle } from '~/components/ui/card';

interface CategoryProps {
  title: string;
  description: string;
  to: string;
}

export function CourseCategoryCard({ title, description, to }: CategoryProps) {
  return (
    <Link to={to} className='group block'>
      <Card className='hover:bg-primary/5 h-full overflow-hidden transition-all duration-200 hover:shadow-md'>
        <CardContent className='px-4'>
          <CardTitle className='text-md group-hover:text-primary mb-2 transition-colors'>
            {title}
          </CardTitle>
          <CardDescription className='font-secondary group-hover:text-primary/80 line-clamp-1 text-sm transition-colors'>
            {description}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}

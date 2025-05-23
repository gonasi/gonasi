import { type PropsWithChildren } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, LoaderCircle, RotateCcw } from 'lucide-react';

import { Container } from '../container';

import { ActionDropdown } from '~/components/action-dropdown';
import { Progress } from '~/components/ui/progress';

interface Props extends PropsWithChildren {
  to: string;
  basePath: string;
  progress: number;
  loading: boolean;
}

export function CoursePlayLayout({ children, to, basePath, progress, loading }: Props) {
  return (
    <div className='pb-[50vh]'>
      <div className='bg-background/80 sticky top-0 z-50 shadow-sm backdrop-blur'>
        <Container className='flex items-center justify-between space-x-4 py-4 md:space-x-8 md:py-6'>
          <Link to={to}>
            <ArrowLeft />
          </Link>
          <Progress value={progress} />
          <div>
            {loading ? (
              <LoaderCircle className='animate-spin cursor-not-allowed' aria-disabled />
            ) : (
              <ActionDropdown
                items={[
                  {
                    title: 'Restart lesson',
                    icon: RotateCcw,
                    to: `${basePath}/restart`,
                    disabled: progress === 0,
                  },
                ]}
              />
            )}
          </div>
        </Container>
      </div>
      <div>{children}</div>
    </div>
  );
}

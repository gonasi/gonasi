import { type PropsWithChildren, useCallback } from 'react';
import { Link, useFetcher } from 'react-router';
import { ArrowLeft, LoaderCircle, RotateCcw } from 'lucide-react';

import { Container } from '../container';

import { ActionDropdown } from '~/components/action-dropdown';
import { Progress } from '~/components/ui/progress';

interface Props extends PropsWithChildren {
  to: string;
  progress: number;
  loading: boolean;
}

export function CoursePlayLayout({ children, to, progress, loading }: Props) {
  const fetcher = useFetcher();

  const handleResetLesson = useCallback(() => {
    const formData = new FormData();
    formData.append('intent', 'resetLessonProgress');
    fetcher.submit(formData, {
      method: 'post',
    });
  }, [fetcher]);

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
                    onClick: () => handleResetLesson(),
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

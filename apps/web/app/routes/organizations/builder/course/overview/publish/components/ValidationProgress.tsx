import { AlertTriangle, CheckCircle } from 'lucide-react';

import { Progress } from '~/components/ui/progress';

interface CompletionStatusProps {
  completionStatus: {
    total: number;
    completed: number;
    percentage: number;
  };
}

export function ValidationProgress({
  completionStatus = { total: 10, completed: 7, percentage: 70 },
}: CompletionStatusProps) {
  const errorCount = completionStatus.total - completionStatus.completed;
  const hasErrors = errorCount > 0;

  return (
    <div className='flex items-center gap-3'>
      <div className='flex min-w-0 items-center gap-1'>
        {hasErrors ? (
          <AlertTriangle className='text-danger h-4 w-4 flex-shrink-0' />
        ) : (
          <CheckCircle className='text-success h-4 w-4 flex-shrink-0' />
        )}
        <span className='text-muted-foreground font-secondary text-sm'>
          {completionStatus.completed}/{completionStatus.total}
        </span>
      </div>

      <div className='min-w-[100px] flex-1'>
        <Progress
          value={completionStatus.percentage}
          className={`h-2 ${hasErrors ? '[&>div]:bg-danger' : '[&>div]:bg-success'}`}
        />
      </div>

      <span className='font-secondary min-w-[35px] text-right text-sm font-medium'>
        {completionStatus.percentage}%
      </span>
    </div>
  );
}

import { HardDrive } from 'lucide-react';

import { Progress } from '~/components/ui/progress';

export function StorageIndicator() {
  // Sample storage data
  const usedStorage = 2.4; // GB
  const totalStorage = 5.0; // GB
  const usagePercentage = (usedStorage / totalStorage) * 100;

  const formatStorage = (gb: number) => {
    if (gb < 1) {
      return `${(gb * 1024).toFixed(0)} MB`;
    }
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <div className='pb-6'>
      <div className='bg-muted/20 w-full rounded-lg p-3'>
        <div className='mb-2 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <HardDrive className='text-muted-foreground h-3 w-3' />
            <span className='text-xs font-medium'>Storage</span>
          </div>
          <span className='text-muted-foreground text-xs'>{usagePercentage.toFixed(0)}%</span>
        </div>
        <Progress value={usagePercentage} className='h-1.5' />
        <div className='text-muted-foreground mt-1 text-xs'>
          {formatStorage(usedStorage)} of {formatStorage(totalStorage)}
        </div>
      </div>
    </div>
  );
}

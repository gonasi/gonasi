import { HardDrive, Plus } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';

export function StorageCard() {
  const usedStorage = 24.3;
  const totalStorage = 100;
  const usagePercentage = (usedStorage / totalStorage) * 100;

  return (
    <Card className='shadow-card hover:shadow-card-hover transition-smooth border-border/50'>
      <CardContent className='p-6'>
        <div className='mb-4 flex items-start justify-between'>
          <div className='flex-1'>
            <p className='text-muted-foreground mb-1 text-sm font-medium'>Storage Used</p>
            <h3 className='text-foreground mb-2 text-3xl font-bold'>{usedStorage} GB</h3>
            <p className='text-muted-foreground text-sm'>of {totalStorage} GB available</p>
          </div>
          <div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg'>
            <HardDrive className='text-primary h-6 w-6' />
          </div>
        </div>

        <div className='mb-4 space-y-2'>
          <Progress value={usagePercentage} className='h-2' />
          <div className='text-muted-foreground flex justify-between text-xs'>
            <span>{usagePercentage.toFixed(1)}% used</span>
            <span>{(totalStorage - usedStorage).toFixed(1)} GB free</span>
          </div>
        </div>

        <div className='border-border/50 mb-4 grid grid-cols-2 gap-2 border-t pt-2'>
          <div className='text-center'>
            <p className='text-muted-foreground text-xs'>Courses</p>
            <p className='text-foreground text-sm font-semibold'>18.5 GB</p>
          </div>
          <div className='text-center'>
            <p className='text-muted-foreground text-xs'>Media</p>
            <p className='text-foreground text-sm font-semibold'>5.8 GB</p>
          </div>
        </div>

        <Button variant='outline' className='group w-full'>
          <Plus className='mr-2 h-4 w-4' />
          Manage Storage
        </Button>
      </CardContent>
    </Card>
  );
}

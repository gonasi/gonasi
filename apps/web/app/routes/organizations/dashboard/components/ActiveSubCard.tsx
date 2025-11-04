import { Zap } from 'lucide-react';

import { Card, CardContent } from '~/components/ui/card';

const mockUserSubscription = {
  currentPlan: 'Scale',
  status: 'active',
  startDate: '2024-01-15',
  nextBillingDate: '2024-12-15',
  monthlyPrice: 39,
  canceledAt: null,
};

export function ActiveSubCard() {
  const isActive = true;
  return (
    <Card className='border-border/50 rounded-none'>
      <CardContent className='p-4'>
        <div className='mb-6 flex items-start justify-between'>
          <div>
            <div className='mb-2 flex items-center gap-2'>
              <h2 className='text-2xl font-bold'>Current plan</h2>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  isActive ? 'bg-green-500/20 text-green-600' : 'bg-destructive/20 text-destructive'
                }`}
              >
                {isActive ? 'Active' : 'Canceled'}
              </span>
            </div>
            <p className='text-muted-foreground'>Your current subscription</p>
          </div>
          <Zap className='text-accent h-6 w-6' />
        </div>

        {/* Billing Info */}
        <div className='border-accent/20 mb-8 space-y-3 border-t pt-6'>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Monthly Price</span>
            <span className='font-semibold'>400</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Start Date</span>
            <span className='font-semibold'>
              {new Date(mockUserSubscription.startDate).toLocaleDateString()}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Next Billing Date</span>
            <span className='font-semibold'>
              {isActive
                ? new Date(mockUserSubscription.nextBillingDate).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
